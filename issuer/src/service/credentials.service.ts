import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CredentialRequestEntity } from '../data/entity/credential-request.entity';
import { CredentialStatus } from '../data/entity/credential-status.enum';
import { CredentialRequestRepository } from '../data/repository/credential-request.repository';
import {
  CreateCredentialRequestDto,
  CredentialDto,
  CredentialOfferDto,
} from '../rest/model/credentials.dto';
import { SdJwtService } from './sd-jwt.service';
import { CredentialsMapper } from '../mapper/credentials.mapper';
import { CredentialRequestValidationService } from './credential-request-validation.service';

@Injectable()
export class CredentialsService {
  constructor(
    private readonly credentialRequestRepository: CredentialRequestRepository,
    private readonly sdJwtService: SdJwtService,
    private readonly credentialRequestValidationService: CredentialRequestValidationService,
  ) {}

  async createRequest(
    dto: CreateCredentialRequestDto,
  ): Promise<CredentialRequestEntity> {
    await this.credentialRequestValidationService.validateCreateRequest(dto);

    const entity = new CredentialRequestEntity();
    entity.transactionId = `TXN-${randomUUID()}`;
    entity.credentialType = dto.credentialType;
    entity.status = CredentialStatus.PENDING;
    entity.requestedAt = new Date();
    entity.issuedCredential = null;
    entity.claims = CredentialsMapper.mapClaims(dto.claims);

    return this.credentialRequestRepository.save(entity);
  }

  async findAll(status?: string): Promise<CredentialRequestEntity[]> {
    const normalized = this.normalizeStatus(status);
    if (!normalized) {
      return this.credentialRequestRepository.findAll();
    }

    return this.credentialRequestRepository.findByStatus(normalized);
  }

  async findOne(id: number): Promise<CredentialRequestEntity> {
    const item = await this.credentialRequestRepository.findOneById(id);
    if (!item) {
      throw new Error(`Credential request ${id} not found`);
    }

    return item;
  }

  async getOffer(transactionId: string): Promise<CredentialOfferDto> {
    const item = await this.credentialRequestRepository.findByTransactionId(
      transactionId,
    );
    if (!item) {
      throw new NotFoundException(
        `Credential request with transactionId '${transactionId}' not found`,
      );
    }

    return CredentialsMapper.toOffer(item);
  }

  async approve(id: number): Promise<CredentialDto> {
    const item = await this.findOne(id);

    if (item.status !== CredentialStatus.PENDING) {
      throw new Error(`Request ${id} must be PENDING before approve`);
    }

    const credential = this.sdJwtService.generateSdJwt(
      item.credentialType,
      item.claims,
    );

    item.status = CredentialStatus.APPROVED;
    item.approvedAt = new Date();
    item.issuedCredential = credential;

    await this.credentialRequestRepository.save(item);

    return {
      credential,
      format: 'vc+sd-jwt',
    };
  }

  async reject(id: number, reason: string): Promise<void> {
    const item = await this.findOne(id);

    if (item.status !== CredentialStatus.PENDING) {
      throw new Error(`Request ${id} must be PENDING before reject`);
    }

    item.status = CredentialStatus.REJECTED;
    item.rejectedAt = new Date();
    item.rejectionReason = reason;

    await this.credentialRequestRepository.save(item);
  }

  private normalizeStatus(status?: string): CredentialStatus | null {
    if (!status) {
      return null;
    }

    const allowed = Object.values(CredentialStatus);
    if (!allowed.includes(status as CredentialStatus)) {
      return null;
    }

    return status as CredentialStatus;
  }
}
