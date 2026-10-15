import { BasicStrategy } from 'passport-http';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BasicAuthStrategy extends PassportStrategy(BasicStrategy) {
  constructor(private configService: ConfigService) {
    super();
  }

  validate(userid: string, password: string): boolean {
    const adminUsername = this.configService.get<string>('adminUsername');
    const adminPassword = this.configService.get<string>('adminPassword');

    if (userid === adminUsername && password === adminPassword) {
      return true;
    }
    throw new UnauthorizedException();
  }
}
