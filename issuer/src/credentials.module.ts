import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClaimEntity } from './data/entity/claim.entity';
import { CredentialRequestEntity } from './data/entity/credential-request.entity';
import { CredentialTypeEntity } from './data/entity/credential-type.entity';
import { ClaimRepository } from './data/repository/claim.repository';
import { CredentialRequestRepository } from './data/repository/credential-request.repository';
import { CredentialTypeRepository } from './data/repository/credential-type.repository';
import { CredentialOffersController } from './rest/controller/credential-offers.controller';
import { CredentialsController } from './rest/controller/credentials.controller';
import { CredentialTypesController } from './rest/controller/credential-types.controller';
import { CredentialRequestValidationService } from './service/credential-request-validation.service';
import { CredentialsService } from './service/credentials.service';
import { CredentialTypesService } from './service/credential-types.service';
import { SdJwtService } from './service/sd-jwt.service';
import { ZkProofService } from './service/zk-proof.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CredentialRequestEntity,
      ClaimEntity,
      CredentialTypeEntity,
    ]),
  ],
  controllers: [
    CredentialsController,
    CredentialOffersController,
    CredentialTypesController,
  ],
  providers: [
    CredentialRequestRepository,
    ClaimRepository,
    CredentialTypeRepository,
    CredentialsService,
    CredentialTypesService,
    CredentialRequestValidationService,
    SdJwtService,
    ZkProofService,
  ],
})
export class CredentialsModule {}
