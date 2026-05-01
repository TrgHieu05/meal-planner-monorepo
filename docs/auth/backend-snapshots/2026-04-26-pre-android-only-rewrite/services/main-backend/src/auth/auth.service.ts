import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';

import { ProviderEnum } from '@meal/database';

@Injectable()
export class AuthService {
  private readonly googleAuthClient = new OAuth2Client();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async googleLogin(req) {
    if (!req.user) {
      return { message: 'Không có dữ liệu từ Google' };
    }

    const { email, firstName, lastName, fullName, providerId } = req.user;

    return this.signInWithGoogleIdentity({
      providerId: providerId ?? email,
      email,
      firstName,
      lastName,
      fullName,
    });
  }

  async exchangeGoogleIdToken(idToken: string) {
    const googleIdentity = await this.verifyGoogleIdToken(idToken);
    return this.signInWithGoogleIdentity(googleIdentity);
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
    };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  private async signInWithGoogleIdentity(identity: GoogleIdentity) {
    try {
      const user = await this.findOrCreateGoogleUser(identity);
      const token = await this.login(user);

      return {
        message: 'Xác thực Google thành công',
        user: {
          id: user.id,
          email: user.email,
          userName: user.userName,
        },
        ...token,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      console.error('Lỗi khi xử lý Google Login:', error);
      throw new InternalServerErrorException('Lỗi máy chủ khi xử lý đăng nhập');
    }
  }

  private async verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity> {
    const trimmedIdToken = idToken.trim();
    if (!trimmedIdToken) {
      throw new UnauthorizedException('Google ID token không hợp lệ');
    }

    try {
      const ticket = await this.googleAuthClient.verifyIdToken({
        idToken: trimmedIdToken,
        audience: this.getGoogleAuthAudiences(),
      });
      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email || !payload.email_verified) {
        throw new UnauthorizedException(
          'Tài khoản Google phải có email đã xác minh',
        );
      }

      return {
        providerId: payload.sub,
        email: payload.email,
        firstName: payload.given_name ?? null,
        lastName: payload.family_name ?? null,
        fullName: payload.name ?? null,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Google ID token không hợp lệ');
    }
  }

  private getGoogleAuthAudiences() {
    const audiences = Array.from(
      new Set(
        [
          this.configService.get<string>('GOOGLE_CLIENT_ID'),
          this.configService.get<string>('GOOGLE_WEB_CLIENT_ID'),
          this.configService.get<string>('GOOGLE_ANDROID_CLIENT_ID'),
          this.configService.get<string>('GOOGLE_IOS_CLIENT_ID'),
        ].filter((value): value is string => Boolean(value?.trim())),
      ),
    );

    if (!audiences.length) {
      throw new InternalServerErrorException(
        'Thiếu cấu hình Google client IDs cho xác thực mobile',
      );
    }

    return audiences;
  }

  private async findOrCreateGoogleUser(identity: GoogleIdentity) {
    const existingProviderAccount = await this.prisma.userProvider.findFirst({
      where: {
        provider: ProviderEnum.GOOGLE,
        providerId: identity.providerId,
      },
      include: {
        user: {
          include: {
            providers: true,
          },
        },
      },
    });

    if (existingProviderAccount?.user) {
      return existingProviderAccount.user;
    }

    let user = await this.prisma.user.findUnique({
      where: { email: identity.email },
      include: { providers: true },
    });

    if (!user) {
      return this.prisma.user.create({
        data: {
          email: identity.email,
          userName: this.buildGoogleUserName(identity),
          gender: 'U',
          providers: {
            create: {
              provider: ProviderEnum.GOOGLE,
              providerId: identity.providerId,
            },
          },
        },
        include: { providers: true },
      });
    }

    const hasGoogleProvider = user.providers.some(
      (provider) =>
        provider.provider === ProviderEnum.GOOGLE &&
        provider.providerId === identity.providerId,
    );

    if (!hasGoogleProvider) {
      await this.prisma.userProvider.create({
        data: {
          userId: user.id,
          provider: ProviderEnum.GOOGLE,
          providerId: identity.providerId,
        },
      });

      user = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { providers: true },
      });
    }

    if (!user) {
      throw new InternalServerErrorException(
        'Không thể đồng bộ tài khoản Google với người dùng nội bộ',
      );
    }

    return user;
  }

  private buildGoogleUserName(identity: GoogleIdentity) {
    const fullName = [identity.firstName, identity.lastName]
      .filter((value): value is string => Boolean(value?.trim()))
      .join(' ')
      .trim();

    if (fullName) {
      return fullName;
    }

    if (identity.fullName?.trim()) {
      return identity.fullName.trim();
    }

    return identity.email.split('@')[0];
  }
}

type GoogleIdentity = {
  providerId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
};
