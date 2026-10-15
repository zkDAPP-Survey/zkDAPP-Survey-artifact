import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CreateCredentialRequestDto } from '../rest/model/credentials.dto';
import { CredentialTypesService } from './credential-types.service';

@Injectable()
export class CredentialRequestValidationService {
  constructor(
    private readonly configService: ConfigService,
    private readonly credentialTypesService: CredentialTypesService,
  ) {}

  async validateCreateRequest(dto: CreateCredentialRequestDto): Promise<void> {
    if (!this.isEnabled()) {
      return;
    }

    const credentialType = await this.credentialTypesService.requireByTypeName(
      dto.credentialType,
    );
    const claimKeys = new Set(Object.keys(dto.claims));
    const missing = credentialType.requiredClaimKeys.filter(
      (key) => !claimKeys.has(key),
    );

    if (missing.length > 0) {
      throw new BadRequestException(
        `Claims do not match credential type '${dto.credentialType}'. Missing keys: ${missing.join(', ')}`,
      );
    }
  }

  private isEnabled(): boolean {
    const configValue = this.configService.get('validateCredentialTypeEnabled');
    const parsedConfigValue = this.parseBoolean(configValue);

    if (parsedConfigValue !== null) {
      return parsedConfigValue;
    }

    return this.parseBoolean(process.env.VALIDATE_CREDENTIAL_TYPE) ?? false;
  }

  private parseBoolean(value: unknown): boolean | null {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }

    if (['false', '0', 'no', 'off'].includes(normalized)) {
      return false;
    }

    return null;
  }
}
