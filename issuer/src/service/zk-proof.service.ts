import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { derivePublicKey, signMessage } from '@zk-kit/eddsa-poseidon';
import { poseidon2, poseidon3 } from 'poseidon-lite';
import { resolveZkPrivateKey } from '../config/babyjub.config';

const SNARK_FIELD =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

export type Disclosure = {
  salt: number;
  claimKey: string;
  claimValue: string;
};

type ZkProof = {
  leaves: string[];
  merkleRoot: string;
  publicKey: [string, string];
  signature: {
    r8: [string, string];
    s: string;
  };
};

@Injectable()
export class ZkProofService {
  constructor(private readonly configService: ConfigService) {}

  buildProof(disclosures: Disclosure[]): ZkProof {
    const privateKey = resolveZkPrivateKey(this.configService);

    const ordered = [...disclosures].sort((a, b) =>
      a.claimKey.localeCompare(b.claimKey, 'en'),
    );

    const leaves = ordered.map((item) => this.computeLeaf(item));

    const merkleRoot = this.computeMerkleRoot(leaves);
    const signature = signMessage(privateKey, merkleRoot);
    const publicKey = derivePublicKey(privateKey);

    return {
      leaves: leaves.map((leaf) => this.normalizeBigInt(leaf)),
      merkleRoot: this.normalizeBigInt(merkleRoot),
      publicKey: [
        this.normalizeBigInt(publicKey[0]),
        this.normalizeBigInt(publicKey[1]),
      ],
      signature: {
        r8: [
          this.normalizeBigInt(signature.R8[0]),
          this.normalizeBigInt(signature.R8[1]),
        ],
        s: this.normalizeBigInt(signature.S),
      },
    };
  }

  private computeLeaf(disclosure: Disclosure): bigint {
    const [salt, key, value] = this.normalizeDisclosure(disclosure);
    return poseidon3([salt, key, value]);
  }

  private computeMerkleRoot(leaves: bigint[]): bigint {
    if (leaves.length === 0) {
      return poseidon2([0n, 0n]);
    }

    let level = leaves;

    while (level.length > 1) {
      const nextLevel: bigint[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = level[i + 1] ?? left;
        nextLevel.push(poseidon2([left, right]));
      }
      level = nextLevel;
    }

    return level[0];
  }

  /**
   * Normalizes a disclosure into bigint components for SNARK-safe hashing.
   * Encoding strategy:
   * - salt: direct uint32
   * - key: string converted to bigint via base-256 encoding (lowercased)
   * - value: auto-detected type (number, ISO date, or string) -> bigint
   */
  private normalizeDisclosure(
    disclosure: Disclosure,
  ): [bigint, bigint, bigint] {
    const salt = BigInt(disclosure.salt >>> 0) % SNARK_FIELD;
    const key = this.stringToBigInt(disclosure.claimKey.toLowerCase());
    const value = this.parseValueToBigInt(disclosure.claimValue);

    return [salt, key, value];
  }

  /**
   * Encodes a string as bigint using base-256 encoding.
   * Each character is converted to its UTF-16 code point and concatenated.
   * Example: "abc" -> (0x61 << 16) | (0x62 << 8) | 0x63
   * Result is reduced modulo SNARK_FIELD to stay within field bounds.
   */
  private stringToBigInt(str: string): bigint {
    let result = 0n;
    for (let i = 0; i < str.length; i++) {
      result = ((result << 8n) | BigInt(str.charCodeAt(i))) % SNARK_FIELD;
    }
    return result;
  }

  /**
   * Parses a value string into bigint with type detection.
   * - If numeric: parse as BigInt
   * - If ISO 8601 date: convert to unix timestamp ms as BigInt
   * - Otherwise: encode as string
   */
  private parseValueToBigInt(valueStr: string): bigint {
    // Try numeric parse
    const num = Number(valueStr);
    if (!isNaN(num) && Number.isInteger(num)) {
      return BigInt(num) % SNARK_FIELD;
    }

    // Try ISO 8601 / RFC 3339 date parse
    const date = new Date(valueStr);
    if (!isNaN(date.getTime())) {
      return BigInt(date.getTime()) % SNARK_FIELD;
    }

    // Fall back to string encoding
    return this.stringToBigInt(valueStr);
  }

  private normalizeBigInt(value: bigint): string {
    return value.toString();
  }
}
