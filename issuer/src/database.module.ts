import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ClaimEntity } from './data/entity/claim.entity';
import { CredentialRequestEntity } from './data/entity/credential-request.entity';
import { CredentialTypeEntity } from './data/entity/credential-type.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('DB_TYPE') ?? 'sqlite';

        if (dbType === 'postgres') {
          return {
            type: 'postgres' as const,
            host: configService.get<string>('DB_HOST') ?? 'localhost',
            port: parseInt(configService.get<string>('DB_PORT') ?? '5432', 10),
            username: configService.get<string>('DB_USER') ?? 'postgres',
            password: configService.get<string>('DB_PASS') ?? 'postgres',
            database: configService.get<string>('DB_NAME') ?? 'zkissuer',
            entities: [CredentialRequestEntity, ClaimEntity, CredentialTypeEntity],
            synchronize: true,
            logging: false,
          };
        }

        return {
          type: 'sqlite' as const,
          database: configService.get<string>('DB_NAME') ?? ':memory:',
          entities: [CredentialRequestEntity, ClaimEntity, CredentialTypeEntity],
          synchronize: true,
          logging: false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
