import { plainToInstance, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

export class EnvironmentVariables {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  PORT?: number;

  @IsOptional()
  @IsIn(['sqlite', 'postgres'])
  DB_TYPE?: 'sqlite' | 'postgres';

  @IsOptional()
  @IsString()
  DB_HOST?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  DB_PORT?: number;

  @IsOptional()
  @IsString()
  DB_USER?: string;

  @IsOptional()
  @IsString()
  DB_PASS?: string;

  @IsOptional()
  @IsString()
  DB_NAME?: string;

  @IsOptional()
  @IsString()
  ISSUER?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  TOKEN_VALIDITY_HOURS?: number;

  @IsOptional()
  @IsIn(['SHA_256'])
  ECDSA_DIGEST?: 'SHA_256';

  @IsOptional()
  @IsString()
  ECDSA_PRIVATE_JWK?: string;

  @IsOptional()
  @IsString()
  ECDSA_PRIVATE_JWK_PATH?: string;

  @IsOptional()
  @IsString()
  ZK_PRIVATE_KEY?: string;

  @IsOptional()
  @IsString()
  ZK_PRIVATE_KEY_PATH?: string;

  @IsOptional()
  VALIDATE_CREDENTIAL_TYPE?: boolean;

  @IsOptional()
  @IsString()
  ADMIN_USERNAME?: string;

  @IsOptional()
  @IsString()
  ADMIN_PASSWORD?: string;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validated;
}
