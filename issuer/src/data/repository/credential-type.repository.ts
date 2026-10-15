import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CredentialTypeEntity } from '../entity/credential-type.entity';

@Injectable()
export class CredentialTypeRepository {
  constructor(
    @InjectRepository(CredentialTypeEntity)
    private readonly repository: Repository<CredentialTypeEntity>,
  ) {}

  save(entity: CredentialTypeEntity): Promise<CredentialTypeEntity> {
    return this.repository.save(entity);
  }

  remove(entity: CredentialTypeEntity): Promise<CredentialTypeEntity> {
    return this.repository.remove(entity);
  }

  findAll(): Promise<CredentialTypeEntity[]> {
    return this.repository.find({
      order: { typeName: 'ASC' },
    });
  }

  findByTypeName(typeName: string): Promise<CredentialTypeEntity | null> {
    return this.repository.findOne({ where: { typeName } });
  }
}
