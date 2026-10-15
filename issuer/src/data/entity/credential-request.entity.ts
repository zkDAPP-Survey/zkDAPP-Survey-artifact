import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CredentialStatus } from './credential-status.enum';
import { ClaimEntity } from './claim.entity';

@Entity('credential_requests')
export class CredentialRequestEntity {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id: number;

  @Column({ name: 'transaction_id', unique: true })
  transactionId: string;

  @Column({ name: 'credential_type' })
  credentialType: string;

  @Column({ type: 'varchar' })
  status: CredentialStatus;

  @Column({ name: 'requested_at', type: 'datetime' })
  requestedAt: Date;

  @Column({ name: 'approved_at', type: 'datetime', nullable: true })
  approvedAt: Date | null;

  @Column({ name: 'rejected_at', type: 'datetime', nullable: true })
  rejectedAt: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ name: 'issued_credential', type: 'text', nullable: true })
  issuedCredential: string | null;

  @OneToMany(() => ClaimEntity, (claim) => claim.credentialRequest, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  claims: ClaimEntity[];
}
