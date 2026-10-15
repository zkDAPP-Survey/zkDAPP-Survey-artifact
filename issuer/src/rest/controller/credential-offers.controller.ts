import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { CredentialsService } from '../../service/credentials.service';
import { CredentialOfferDto } from '../model/credentials.dto';
import { Public } from '../../common/auth/public.decorator';

@Controller('api/credentials/offers')
export class CredentialOffersController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Public()
  @Get(':transactionId')
  @HttpCode(HttpStatus.OK)
  findOneOffer(
    @Param('transactionId') transactionId: string,
  ): Promise<CredentialOfferDto> {
    return this.credentialsService.getOffer(transactionId);
  }
}
