import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('credential_types')
export class CredentialTypeEntity {
  @PrimaryColumn({ name: 'type_name' })
  typeName: string;

  @Column({ name: 'required_claim_keys', type: 'simple-json' })
  requiredClaimKeys: string[];
}
