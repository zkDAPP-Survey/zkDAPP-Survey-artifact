import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { generateKeyPairSync, randomBytes } from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { AppModule } from '../src/app.module';

type CreateResponseBody = {
  id: number;
  transactionId: string;
  status: string;
};

type SummaryResponseBody = Array<{ id: number }>;

type DetailResponseBody = {
  claims: Array<{ key: string; value: string }>;
};

type ApproveResponseBody = {
  format: string;
  credential: string;
};

type OfferResponseBody = {
  transactionId: string;
  status: string;
  credential: string | null;
};

type CredentialTypeBody = {
  typeName: string;
  requiredClaimKeys: string[];
};

type CredentialTypeNamesBody = {
  credentialTypes: string[];
};

function seedSigningEnv(): void {
  const { privateKey: ecdsaPrivateKey } = generateKeyPairSync('ec', {
    namedCurve: 'P-256',
  });

  process.env.ECDSA_PRIVATE_JWK = JSON.stringify(
    ecdsaPrivateKey.export({ format: 'jwk' }),
  );
  process.env.ZK_PRIVATE_KEY = randomBytes(32).toString('hex');
}

async function createApp(): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.init();
  return app;
}

describe('ZkIssuer API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(() => {
    seedSigningEnv();
    process.env.VALIDATE_CREDENTIAL_TYPE = 'false';
  });

  beforeEach(async () => {
    app = await createApp();
  });

  it('creates request, lists, reads detail and approves', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/credentials/requests')
      .send({
        credentialType: 'ResidencePermit',
        signatureType: 'ECDSA',
        claims: {
          first_name: 'Maksym',
          last_name: 'Hnatov',
        },
      })
      .expect(202);

    const createBody = createResponse.body as CreateResponseBody;
    expect(createBody.transactionId).toMatch(/^TXN-/);
    expect(createBody.status).toBe('PENDING');
    const id = createBody.id;

    const pendingOfferResponse = await request(app.getHttpServer())
      .get(`/api/credentials/offers/${createBody.transactionId}`)
      .expect(200);
    const pendingOfferBody = pendingOfferResponse.body as OfferResponseBody;
    expect(pendingOfferBody.transactionId).toBe(createBody.transactionId);
    expect(pendingOfferBody.status).toBe('PENDING');
    expect(pendingOfferBody.credential).toBeNull();

    const listResponse = await request(app.getHttpServer())
      .get('/api/credentials/requests?status=INVALID')
      .expect(200);
    const listBody = listResponse.body as SummaryResponseBody;
    expect(Array.isArray(listBody)).toBe(true);
    expect(listBody[0].id).toBe(id);

    const detailResponse = await request(app.getHttpServer())
      .get(`/api/credentials/requests/${id}`)
      .expect(200);
    const detailBody = detailResponse.body as DetailResponseBody;
    expect(detailBody.claims).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'first_name', value: 'Maksym' }),
      ]),
    );

    const approveResponse = await request(app.getHttpServer())
      .post(`/api/credentials/requests/${id}/approve`)
      .expect(200);
    const approveBody = approveResponse.body as ApproveResponseBody;

    expect(approveBody.format).toBe('vc+sd-jwt');
    expect(approveBody.credential).toContain('~');
    expect(approveBody.credential.endsWith('~')).toBe(true);

    const compactJwt = approveBody.credential.split('~')[0];
    const payloadSegment = compactJwt.split('.')[1];
    const payloadJson = Buffer.from(payloadSegment, 'base64url').toString(
      'utf8',
    );
    const payload = JSON.parse(payloadJson) as {
      zkp?: {
        leaves?: string[];
        merkleRoot?: string;
      };
    };

    expect(Array.isArray(payload.zkp?.leaves)).toBe(true);
    expect(payload.zkp?.leaves?.length).toBeGreaterThan(0);
    expect(typeof payload.zkp?.merkleRoot).toBe('string');

    const approvedOfferResponse = await request(app.getHttpServer())
      .get(`/api/credentials/offers/${createBody.transactionId}`)
      .expect(200);
    const approvedOfferBody = approvedOfferResponse.body as OfferResponseBody;
    expect(approvedOfferBody.transactionId).toBe(createBody.transactionId);
    expect(approvedOfferBody.status).toBe('APPROVED');
    expect(approvedOfferBody.credential).toBe(approveBody.credential);
  });

  it('manages credential types with create, list, names, patch and delete', async () => {
    const createTypeResponse = await request(app.getHttpServer())
      .post('/api/credentials/types')
      .send({
        typeName: 'BirthCertificate',
        requiredClaimKeys: ['first_name', 'last_name'],
      })
      .expect(201);

    const createdTypeBody = createTypeResponse.body as CredentialTypeBody;
    expect(createdTypeBody).toEqual(
      expect.objectContaining({
        typeName: 'BirthCertificate',
        requiredClaimKeys: ['first_name', 'last_name'],
      }),
    );

    const listResponse = await request(app.getHttpServer())
      .get('/api/credentials/types')
      .expect(200);
    const typeListBody = listResponse.body as CredentialTypeBody[];
    expect(Array.isArray(typeListBody)).toBe(true);
    expect(typeListBody[0]).toEqual(
      expect.objectContaining({ typeName: 'BirthCertificate' }),
    );

    const namesResponse = await request(app.getHttpServer())
      .get('/api/credentials/types/names')
      .expect(200);
    const namesBody = namesResponse.body as CredentialTypeNamesBody;
    expect(namesBody.credentialTypes).toEqual(
      expect.arrayContaining(['BirthCertificate']),
    );

    const patchResponse = await request(app.getHttpServer())
      .patch('/api/credentials/types/BirthCertificate')
      .send({ requiredClaimKeys: ['first_name', 'last_name', 'date_of_birth'] })
      .expect(200);
    const patchedTypeBody = patchResponse.body as CredentialTypeBody;
    expect(patchedTypeBody.requiredClaimKeys).toEqual([
      'date_of_birth',
      'first_name',
      'last_name',
    ]);

    await request(app.getHttpServer())
      .head('/api/credentials/types/BirthCertificate')
      .expect(200);

    await request(app.getHttpServer())
      .delete('/api/credentials/types/BirthCertificate')
      .expect(204);

    await request(app.getHttpServer())
      .get('/api/credentials/types/BirthCertificate')
      .expect(404);
  });

  it('enforces type claim validation when feature flag is enabled', async () => {
    await app.close();

    process.env.VALIDATE_CREDENTIAL_TYPE = 'true';
    const validatedApp = await createApp();

    await request(validatedApp.getHttpServer())
      .post('/api/credentials/types')
      .send({
        typeName: 'ResidencePermit',
        requiredClaimKeys: ['first_name', 'permit_number'],
      })
      .expect(201);

    await request(validatedApp.getHttpServer())
      .post('/api/credentials/requests')
      .send({
        credentialType: 'ResidencePermit',
        claims: {
          first_name: 'Maksym',
        },
      })
      .expect(400);

    await request(validatedApp.getHttpServer())
      .post('/api/credentials/requests')
      .send({
        credentialType: 'ResidencePermit',
        claims: {
          first_name: 'Maksym',
          permit_number: 'ABC-123',
        },
      })
      .expect(202);

    await validatedApp.close();
    process.env.VALIDATE_CREDENTIAL_TYPE = 'false';
    app = await createApp();
  });

  it('returns 400 validation envelope for invalid payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/credentials/requests')
      .send({
        credentialType: '',
        signatureType: 'WRONG',
        claims: {
          claim: 123,
        },
      })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        error: 'Validation Error',
        status: 400,
      }),
    );
  });

  afterEach(async () => {
    await app.close();
  });
});
