import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CredentialRequestEntity } from '../entity/credential-request.entity';
import { CredentialStatus } from '../entity/credential-status.enum';

@Injectable()
export class CredentialRequestRepository {
  constructor(
    @InjectRepository(CredentialRequestEntity)
    private readonly repository: Repository<CredentialRequestEntity>,
  ) {}

  save(entity: CredentialRequestEntity): Promise<CredentialRequestEntity> {
    return this.repository.save(entity);
  }

  findAll(): Promise<CredentialRequestEntity[]> {
    return this.repository.find({
      order: { id: 'DESC' },
    });
  }

  findByStatus(status: CredentialStatus): Promise<CredentialRequestEntity[]> {
    return this.repository.find({
      where: { status },
      order: { id: 'DESC' },
    });
  }

  findOneById(id: number): Promise<CredentialRequestEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  findByTransactionId(
    transactionId: string,
  ): Promise<CredentialRequestEntity | null> {
    return this.repository.findOne({ where: { transactionId } });
  }
}
