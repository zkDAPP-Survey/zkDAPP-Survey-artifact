import { derivePublicKey } from '@zk-kit/eddsa-poseidon';
import { generateKeyPairSync, createHash, randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

type Jwk = Record<string, unknown>;

function b64uToBytes(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64');
}

function getRequiredString(jwk: Jwk, key: string): string {
  const value = jwk[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing expected JWK field: ${key}`);
  }
  return value;
}

function withKid(prefix: string, digestSource: Buffer, jwk: Jwk): Jwk {
  const kid = `${prefix}-${createHash('sha256').update(digestSource).digest('hex').slice(0, 16)}`;
  return { ...jwk, kid };
}

function generateEcdsa(rootDir: string): void {
  const { privateKey } = generateKeyPairSync('ec', { namedCurve: 'P-256' });
  const privateJwk = privateKey.export({ format: 'jwk' }) as Jwk;

  const x = getRequiredString(privateJwk, 'x');
  const y = getRequiredString(privateJwk, 'y');
  const digestSource = Buffer.concat([b64uToBytes(x), b64uToBytes(y)]);

  const ecdsaPrivate = withKid('ecdsa', digestSource, privateJwk);
  const ecdsaPublic = {
    kty: 'EC',
    crv: 'P-256',
    x,
    y,
    kid: ecdsaPrivate.kid,
  };

  const privatePath = resolve(rootDir, 'ecdsa-private.jwk.json');
  const publicPath = resolve(rootDir, 'ecdsa-public.jwk.json');
  writeFileSync(
    privatePath,
    `${JSON.stringify(ecdsaPrivate, null, 2)}\n`,
    'utf8',
  );
  writeFileSync(
    publicPath,
    `${JSON.stringify(ecdsaPublic, null, 2)}\n`,
    'utf8',
  );

  console.log(privatePath);
  console.log(publicPath);
}

function generateZkKeys(rootDir: string): void {
  const zkPrivateKeyBytes = randomBytes(32);
  const zkPrivateKeyDecimal = BigInt(
    `0x${zkPrivateKeyBytes.toString('hex')}`,
  ).toString();
  const [x, y] = derivePublicKey(zkPrivateKeyBytes);

  const privatePath = resolve(rootDir, 'zk-private.key.dec');
  const publicPath = resolve(rootDir, 'zk-public.key.json');

  writeFileSync(privatePath, `${zkPrivateKeyDecimal}\n`, 'utf8');
  writeFileSync(
    publicPath,
    `${JSON.stringify(
      {
        curve: 'babyjubjub',
        algorithm: 'eddsa-poseidon',
        publicKey: {
          x: x.toString(),
          y: y.toString(),
        },
      },
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.log(privatePath);
  console.log(publicPath);
}

function main(): void {
  const rootDir = resolve(process.cwd(), process.env.KEYS_OUTPUT_DIR ?? 'keys');
  mkdirSync(rootDir, { recursive: true });
  generateEcdsa(rootDir);
  generateZkKeys(rootDir);
}

main();
