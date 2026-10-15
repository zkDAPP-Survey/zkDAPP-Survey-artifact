import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCredentialTypeDto {
  @IsString()
  @IsNotEmpty()
  typeName: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({ each: true })
  requiredClaimKeys: string[];
}

export class PatchCredentialTypeDto {
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({ each: true })
  requiredClaimKeys?: string[];
}

export class CredentialTypeDto {
  typeName: string;
  requiredClaimKeys: string[];
}

export class CredentialTypeResponseDto {
  credentialTypes: CredentialTypeDto[];
}

export class CredentialTypeNamesResponseDto {
  credentialTypes: string[];
}
