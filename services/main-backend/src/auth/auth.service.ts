import {
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';

import { Prisma, ProviderEnum } from '@meal/database';
import { toGoogleIdTokenExchangeResponse } from './auth-user.mapper';

@Injectable()
export class AuthService {
  private readonly googleAuthClient = new OAuth2Client();
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async exchangeGoogleIdToken(idToken: string) {
    try {
      const googleIdentity = await this.verifyGoogleIdToken(idToken);
      const user = await this.findOrCreateGoogleUser(googleIdentity);
      const accessToken = this.issueAccessToken(user);

      return toGoogleIdTokenExchangeResponse({
        message: 'Xác thực Google thành công',
        user,
        accessToken,
      });
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      this.logger.error(
        'Lỗi khi xử lý Google ID token exchange',
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Lỗi máy chủ khi xử lý đăng nhập');
    }
  }

  private issueAccessToken(user: { id: string; email: string }) {
    return this.jwtService.sign({
      email: user.email,
      sub: user.id,
    });
  }

  private async verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity> {
    const trimmedIdToken = idToken.trim();
    if (!trimmedIdToken) {
      throw new UnauthorizedException('Google ID token không hợp lệ');
    }

    try {
      const ticket = await this.googleAuthClient.verifyIdToken({
        idToken: trimmedIdToken,
        audience: this.getGoogleWebAudience(),
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

  private getGoogleWebAudience() {
    const audience = this.configService
      .get<string>('GOOGLE_WEB_CLIENT_ID')
      ?.trim();

    if (!audience) {
      throw new InternalServerErrorException(
        'Thiếu cấu hình GOOGLE_WEB_CLIENT_ID cho xác thực Google ID token',
      );
    }

    return audience;
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
            profile: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (existingProviderAccount?.user) {
      return existingProviderAccount.user;
    }

    let user = await this.prisma.user.findUnique({
      where: { email: identity.email },
      include: {
        providers: true,
        profile: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!user) {
      return this.prisma.user.create({
        data: {
          email: identity.email,
          userName: this.buildGoogleUserName(identity),
          gender: null,
          providers: {
            create: {
              provider: ProviderEnum.GOOGLE,
              providerId: identity.providerId,
            },
          },
        },
        include: {
          providers: true,
          profile: {
            select: {
              userId: true,
            },
          },
        },
      });
    }

    const hasGoogleProvider = user.providers.some(
      (provider) =>
        provider.provider === ProviderEnum.GOOGLE &&
        provider.providerId === identity.providerId,
    );

    if (!hasGoogleProvider) {
      try {
        await this.prisma.userProvider.create({
          data: {
            userId: user.id,
            provider: ProviderEnum.GOOGLE,
            providerId: identity.providerId,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          return this.reloadUserOrFail(user.id);
        }

        throw error;
      }

      return this.reloadUserOrFail(user.id);
    }

    return user;
  }

  private async reloadUserOrFail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        providers: true,
        profile: {
          select: {
            userId: true,
          },
        },
      },
    });

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
