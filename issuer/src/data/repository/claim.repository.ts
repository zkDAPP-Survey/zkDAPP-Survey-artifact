import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClaimEntity } from '../entity/claim.entity';

@Injectable()
export class ClaimRepository {
  constructor(
    @InjectRepository(ClaimEntity)
    private readonly repository: Repository<ClaimEntity>,
  ) {}

  save(claims: ClaimEntity[]): Promise<ClaimEntity[]> {
    return this.repository.save(claims);
  }
}
