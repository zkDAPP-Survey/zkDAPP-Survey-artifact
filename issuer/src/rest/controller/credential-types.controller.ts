import {
  Body,
  Controller,
  Delete,
  Get,
  Head,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CredentialTypesService } from '../../service/credential-types.service';
import {
  CreateCredentialTypeDto,
  CredentialTypeDto,
  CredentialTypeNamesResponseDto,
  CredentialTypeResponseDto,
  PatchCredentialTypeDto,
} from '../model/credential-types.dto';
import { Public } from '../../common/auth/public.decorator';

@Controller('api/credentials/types')
export class CredentialTypesController {
  constructor(
    private readonly credentialTypesService: CredentialTypesService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateCredentialTypeDto): Promise<CredentialTypeDto> {
    return this.credentialTypesService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(): Promise<CredentialTypeResponseDto> {
    return this.credentialTypesService.findAll();
  }

  @Public()
  @Get('names')
  @HttpCode(HttpStatus.OK)
  async findAllNames(): Promise<CredentialTypeNamesResponseDto> {
    return this.credentialTypesService.findAllNames();
  }

  @Public()
  @Get(':typeName')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('typeName') typeName: string): Promise<CredentialTypeDto> {
    return this.credentialTypesService.findOne(typeName);
  }

  @Public()
  @Head(':typeName')
  @HttpCode(HttpStatus.OK)
  async head(@Param('typeName') typeName: string): Promise<void> {
    await this.credentialTypesService.findOne(typeName);
  }

  @Patch(':typeName')
  @HttpCode(HttpStatus.OK)
  patch(
    @Param('typeName') typeName: string,
    @Body() dto: PatchCredentialTypeDto,
  ): Promise<CredentialTypeDto> {
    return this.credentialTypesService.patch(typeName, dto);
  }

  @Delete(':typeName')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('typeName') typeName: string): Promise<void> {
    await this.credentialTypesService.remove(typeName);
  }
}
