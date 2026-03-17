import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './google.strategy';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    PassportModule,
    ConfigModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy, 
  ],
})
export class AuthModule {}

