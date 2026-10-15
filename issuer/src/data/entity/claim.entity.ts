import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { CredentialRequestEntity } from './credential-request.entity';

@Entity('claims')
export class ClaimEntity {
  @PrimaryColumn({ name: 'credential_request_id', type: 'integer' })
  credentialRequestId: number;

  @PrimaryColumn({ name: 'claim_key' })
  claimKey: string;

  @Column({ name: 'claim_value', type: 'text' })
  claimValue: string;

  @ManyToOne(
    () => CredentialRequestEntity,
    (credentialRequest) => credentialRequest.claims,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'credential_request_id' })
  credentialRequest: CredentialRequestEntity;
}
