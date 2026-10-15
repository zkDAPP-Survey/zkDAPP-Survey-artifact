import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';

function decimalToBytes(value: bigint): Buffer {
  const hex = value.toString(16).padStart(64, '0');
  return Buffer.from(hex, 'hex');
}

function parsePrivateKeyMaterial(raw: string): Buffer {
  const value = raw.trim();

  if (/^(0x)?[0-9a-f]{64}$/i.test(value)) {
    const normalized = value.replace(/^0x/i, '').toLowerCase();
    return Buffer.from(normalized, 'hex');
  }

  if (/^\d+$/.test(value)) {
    return decimalToBytes(BigInt(value));
  }

  throw new Error(
    'ZK private key must be provided as 32-byte hex or decimal value',
  );
}

export function resolveZkPrivateKey(configService: ConfigService): Buffer {
  const inlineKey = configService.get<string>('zkPrivateKey');
  if (inlineKey) {
    return parsePrivateKeyMaterial(inlineKey);
  }

  const keyPath = configService.get<string>('zkPrivateKeyPath');
  if (keyPath) {
    const content = readFileSync(keyPath, 'utf8');
    return parsePrivateKeyMaterial(content);
  }

  throw new Error(
    'ZK private key must be provided via ZK_PRIVATE_KEY or ZK_PRIVATE_KEY_PATH',
  );
}
