import { ClaimEntity } from '../data/entity/claim.entity';
import { CredentialRequestEntity } from '../data/entity/credential-request.entity';
import {
  ClaimDto,
  CredentialOfferDto,
  CredentialRequestDetailDto,
  CredentialRequestResponseDto,
  CredentialRequestSummaryDto,
} from '../rest/model/credentials.dto';

export class CredentialsMapper {
  static toCreateResponse(
    request: CredentialRequestEntity,
  ): CredentialRequestResponseDto {
    return {
      id: request.id,
      transactionId: request.transactionId,
      status: request.status,
    };
  }

  static toSummary(
    request: CredentialRequestEntity,
  ): CredentialRequestSummaryDto {
    return {
      id: request.id,
      transactionId: request.transactionId,
      credentialType: request.credentialType,
      status: request.status,
      requestedAt: request.requestedAt,
    };
  }

  static toDetail(
    request: CredentialRequestEntity,
  ): CredentialRequestDetailDto {
    return {
      id: request.id,
      transactionId: request.transactionId,
      credentialType: request.credentialType,
      status: request.status,
      requestedAt: request.requestedAt,
      approvedAt: request.approvedAt,
      rejectedAt: request.rejectedAt,
      rejectionReason: request.rejectionReason,
      claims: request.claims.map((claim) => this.toClaim(claim)),
    };
  }

  static toOffer(request: CredentialRequestEntity): CredentialOfferDto {
    return {
      transactionId: request.transactionId,
      status: request.status,
      credential: request.issuedCredential,
    };
  }

  private static toClaim(claim: ClaimEntity): ClaimDto {
    return {
      key: claim.claimKey,
      value: claim.claimValue,
    };
  }

  static mapClaims(claims: Record<string, string>): ClaimEntity[] {
    return Object.entries(claims).map(([key, value]) => {
      const claim = new ClaimEntity();
      claim.claimKey = key;
      claim.claimValue = value;
      return claim;
    });
  }
}
