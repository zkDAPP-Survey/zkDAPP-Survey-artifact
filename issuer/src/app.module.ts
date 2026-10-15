import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import appConfig from './config/app.config';
import { validateEnv } from './config/env.validation';
import { AppController } from './app.controller';
import { CredentialsModule } from './credentials.module';
import { DatabaseModule } from './database.module';
import { BasicAuthStrategy } from './common/auth/basic.strategy';
import { BasicAuthGuard } from './common/auth/basic-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateEnv,
    }),
    PassportModule,
    DatabaseModule,
    CredentialsModule,
  ],
  controllers: [AppController],
  providers: [
    BasicAuthStrategy,
    {
      provide: APP_GUARD,
      useClass: BasicAuthGuard,
    },
  ],
})
export class AppModule {}
