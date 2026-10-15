import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { CredentialStatus } from '../../data/entity/credential-status.enum';
import { IsStringRecord } from './validators/is-string-record.validator';

export class CreateCredentialRequestDto {
  @IsString()
  @IsNotEmpty()
  credentialType: string;

  @IsObject()
  @IsStringRecord()
  claims: Record<string, string>;

  @IsOptional()
  @IsString()
  proof?: string;
}

export class CredentialRequestResponseDto {
  id: number;
  transactionId: string;
  status: CredentialStatus;
}

export class CredentialRequestSummaryDto {
  id: number;
  transactionId: string;
  credentialType: string;
  status: CredentialStatus;
  requestedAt: Date;
}

export class ClaimDto {
  key: string;
  value: string;
}

export class CredentialRequestDetailDto {
  id: number;
  transactionId: string;
  credentialType: string;
  status: CredentialStatus;
  requestedAt: Date;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  claims: ClaimDto[];
}

export class CredentialDto {
  credential: string;
  format: 'vc+sd-jwt';
}

export class CredentialOfferDto {
  transactionId: string;
  status: CredentialStatus;
  credential: string | null;
}

export class RejectCredentialRequestDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}
