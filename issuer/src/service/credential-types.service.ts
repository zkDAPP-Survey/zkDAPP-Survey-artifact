import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CredentialTypeEntity } from '../data/entity/credential-type.entity';
import { CredentialTypeRepository } from '../data/repository/credential-type.repository';
import {
  CreateCredentialTypeDto,
  CredentialTypeDto,
  CredentialTypeNamesResponseDto,
  CredentialTypeResponseDto,
  PatchCredentialTypeDto,
} from '../rest/model/credential-types.dto';

@Injectable()
export class CredentialTypesService {
  constructor(
    private readonly credentialTypeRepository: CredentialTypeRepository,
  ) {}

  async create(dto: CreateCredentialTypeDto): Promise<CredentialTypeDto> {
    const existing = await this.credentialTypeRepository.findByTypeName(
      dto.typeName,
    );
    if (existing) {
      throw new ConflictException(
        `Credential type '${dto.typeName}' already exists`,
      );
    }

    const entity = new CredentialTypeEntity();
    entity.typeName = dto.typeName;
    entity.requiredClaimKeys = this.normalizeClaimKeys(dto.requiredClaimKeys);

    const saved = await this.credentialTypeRepository.save(entity);
    return this.toDto(saved);
  }

  async findAll(): Promise<CredentialTypeResponseDto> {
    const items = await this.credentialTypeRepository.findAll();
    return {
      credentialTypes: items.map((item) => this.toDto(item)),
    };
  }

  async findAllNames(): Promise<CredentialTypeNamesResponseDto> {
    const items = await this.credentialTypeRepository.findAll();
    return {
      credentialTypes: items.map((item) => item.typeName),
    };
  }

  async findOne(typeName: string): Promise<CredentialTypeDto> {
    const item = await this.getExisting(typeName);
    return this.toDto(item);
  }

  async patch(
    typeName: string,
    dto: PatchCredentialTypeDto,
  ): Promise<CredentialTypeDto> {
    const item = await this.getExisting(typeName);

    if (dto.requiredClaimKeys !== undefined) {
      item.requiredClaimKeys = this.normalizeClaimKeys(dto.requiredClaimKeys);
    }

    const saved = await this.credentialTypeRepository.save(item);
    return this.toDto(saved);
  }

  async remove(typeName: string): Promise<void> {
    const item = await this.getExisting(typeName);
    await this.credentialTypeRepository.remove(item);
  }

  async requireByTypeName(typeName: string): Promise<CredentialTypeEntity> {
    return this.getExisting(typeName);
  }

  private async getExisting(typeName: string): Promise<CredentialTypeEntity> {
    const item = await this.credentialTypeRepository.findByTypeName(typeName);
    if (!item) {
      throw new NotFoundException(`Credential type '${typeName}' not found`);
    }

    return item;
  }

  private normalizeClaimKeys(claimKeys: string[]): string[] {
    const normalized = claimKeys
      .map((key) => key.trim())
      .filter((key) => key.length > 0);

    return [...new Set(normalized)].sort((a, b) => a.localeCompare(b));
  }

  private toDto(item: CredentialTypeEntity): CredentialTypeDto {
    return {
      typeName: item.typeName,
      requiredClaimKeys: item.requiredClaimKeys,
    };
  }
}
