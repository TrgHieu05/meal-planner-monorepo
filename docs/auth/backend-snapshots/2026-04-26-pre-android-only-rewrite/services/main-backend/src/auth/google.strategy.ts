import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  type StrategyOptions,
  VerifyCallback,
} from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly configService: ConfigService) {
    const clientID = configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectURI = configService.get<string>('GOOGLE_REDIRECT_URI');

    const missing: string[] = [];
    if (!clientID) missing.push('GOOGLE_CLIENT_ID');
    if (!clientSecret) missing.push('GOOGLE_CLIENT_SECRET');
    if (!redirectURI) missing.push('GOOGLE_REDIRECT_URI');

    if (missing.length) {
      throw new Error(
        `Thiếu cấu hình Google OAuth (${missing.join(
          ', ',
        )}). Hãy set trong .env (root repo) hoặc env của container rồi rebuild/restart backend.`,
      );
    }

    const options: StrategyOptions = {
      clientID: clientID as string,
      clientSecret: clientSecret as string,
      callbackURL: redirectURI as string,
      scope: ['email', 'profile'],
    };

    super(options);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, displayName, name, emails } = profile;
    const user = {
      providerId: id,
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      fullName: displayName,
      accessToken,
      refreshToken,
    };
    done(null, user);
  }
}
