import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CredentialsService } from '../../service/credentials.service';
import { CredentialsMapper } from '../../mapper/credentials.mapper';
import {
  CreateCredentialRequestDto,
  CredentialDto,
  CredentialRequestDetailDto,
  CredentialRequestResponseDto,
  CredentialRequestSummaryDto,
  RejectCredentialRequestDto,
} from '../model/credentials.dto';
import { Public } from '../../common/auth/public.decorator';

@Controller('api/credentials/requests')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async create(
    @Body() dto: CreateCredentialRequestDto,
  ): Promise<CredentialRequestResponseDto> {
    const created = await this.credentialsService.createRequest(dto);
    return CredentialsMapper.toCreateResponse(created);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('status') status?: string,
  ): Promise<CredentialRequestSummaryDto[]> {
    const list = await this.credentialsService.findAll(status);
    return list.map((item) => CredentialsMapper.toSummary(item));
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CredentialRequestDetailDto> {
    const item = await this.credentialsService.findOne(id);
    return CredentialsMapper.toDetail(item);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  async approve(@Param('id', ParseIntPipe) id: number): Promise<CredentialDto> {
    return this.credentialsService.approve(id);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectCredentialRequestDto,
  ): Promise<void> {
    await this.credentialsService.reject(id, dto.reason);
  }
}
