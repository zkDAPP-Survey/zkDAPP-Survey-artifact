import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';

export type Jwk = Record<string, unknown>;

export function resolveEcdsaPrivateJwk(configService: ConfigService): Jwk {
  const rawJwk = configService.get<string>('ecdsaPrivateJwk');
  if (rawJwk) {
    return JSON.parse(rawJwk) as Jwk;
  }

  const jwkPath = configService.get<string>('ecdsaPrivateJwkPath');
  if (jwkPath) {
    const content = readFileSync(jwkPath, 'utf8');
    return JSON.parse(content) as Jwk;
  }

  throw new Error(
    'Private JWK must be provided via ECDSA_PRIVATE_JWK or ECDSA_PRIVATE_JWK_PATH',
  );
}
