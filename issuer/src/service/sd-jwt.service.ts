import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createPrivateKey, randomBytes, sign } from 'crypto';
import { toBase64Url } from '../common/utils/base64url.util';
import { resolveEcdsaPrivateJwk } from '../config/jwk.config';
import { ClaimEntity } from '../data/entity/claim.entity';
import { Disclosure, ZkProofService } from './zk-proof.service';

@Injectable()
export class SdJwtService {
  constructor(
    private readonly configService: ConfigService,
    private readonly zkProofService: ZkProofService,
  ) {}

  generateSdJwt(credentialType: string, claims: ClaimEntity[]): string {
    const privateJwk = resolveEcdsaPrivateJwk(this.configService);

    const disclosureInputs = claims.map((claim) => this.toDisclosure(claim));
    const disclosures = disclosureInputs.map((item) =>
      this.createDisclosure(item),
    );
    const digests = disclosures.map((disclosure) =>
      this.digestDisclosure(disclosure),
    );
    const zkp = this.zkProofService.buildProof(disclosureInputs);

    const now = Math.floor(Date.now() / 1000);
    const issuer =
      this.configService.get<string>('issuer') ?? 'http://zkissuer.local';
    const validityHours =
      this.configService.get<number>('tokenValidityHours') ?? 24;

    const payload = {
      iss: issuer,
      sub: `subject_${Date.now()}`,
      vct: credentialType,
      iat: now,
      exp: now + validityHours * 3600,
      _sd_alg: 'sha-256',
      _sd: digests,
      zkp,
    };

    const signedJwt = this.signJwt(payload, privateJwk);
    return `${signedJwt}~${disclosures.join('~')}~`;
  }

  private signJwt(
    payload: Record<string, unknown>,
    privateJwk: Record<string, unknown>,
  ): string {
    const header = { alg: 'ES256', typ: 'sd+jwt' };
    const encodedHeader = toBase64Url(JSON.stringify(header));
    const encodedPayload = toBase64Url(JSON.stringify(payload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;

    const keyObject = createPrivateKey({
      key: privateJwk,
      format: 'jwk',
    });

    const signature = sign('sha256', Buffer.from(signingInput, 'utf8'), {
      key: keyObject,
      dsaEncoding: 'ieee-p1363',
    });

    return `${signingInput}.${toBase64Url(signature)}`;
  }

  private createDisclosure(disclosure: Disclosure): string {
    const disclosureArray = [
      disclosure.salt,
      disclosure.claimKey,
      disclosure.claimValue,
    ];
    return toBase64Url(JSON.stringify(disclosureArray));
  }

  private digestDisclosure(disclosure: string): string {
    const digest = createHash('sha256').update(disclosure, 'utf8').digest();
    return toBase64Url(digest);
  }

  private toDisclosure(claim: ClaimEntity): Disclosure {
    return {
      salt: randomBytes(4).readUInt32BE(0),
      claimKey: claim.claimKey,
      claimValue: claim.claimValue,
    };
  }
}
