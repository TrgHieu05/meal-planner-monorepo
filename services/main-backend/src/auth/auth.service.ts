import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { JwtService } from '@nestjs/jwt';

import { ProviderEnum } from '@meal/database';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async googleLogin(req) {
    if (!req.user) {
      return { message: 'Không có dữ liệu từ Google' };
    }

    const { email, firstName, lastName } = req.user;

    try {
      // Tìm user theo email
      let user = await this.prisma.user.findUnique({
        where: { email },
        include: { providers: true },
      });

      if (!user) {
        // Tạo user mới nếu chưa tồn tại
        user = await this.prisma.user.create({
          data: {
            email,
            userName: `${firstName} ${lastName}`.trim(),
            gender: 'U', // Default to Unknown
            providers: {
              create: {
                provider: ProviderEnum.GOOGLE,
                providerId: email,
              },
            },
          },
          include: { providers: true },
        });
      }

      // Tạo Internal JWT
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
      console.error('Lỗi khi xử lý Google Login:', error);
      throw new InternalServerErrorException('Lỗi máy chủ khi xử lý đăng nhập');
    }
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
}

