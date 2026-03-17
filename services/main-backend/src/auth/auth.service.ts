import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

// Định nghĩa Enum ProviderEnum cục bộ nếu không import được từ @prisma/client
// hoặc import trực tiếp từ @prisma/client
import { ProviderEnum } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async googleLogin(req) {
    if (!req.user) {
      return 'No user from google';
    }

    const { email, firstName, lastName, accessToken } = req.user;

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
                providerId: email, // Dùng email làm providerId tạm thời
              },
            },
          },
          include: { providers: true },
        });
      } else {
        // Nếu user đã tồn tại, kiểm tra xem đã có provider GOOGLE chưa
        const googleProvider = user.providers.find(
          (p) => p.provider === ProviderEnum.GOOGLE,
        );

        if (!googleProvider) {
          // Thêm provider GOOGLE nếu chưa có
          await this.prisma.userProvider.create({
            data: {
              userId: user.id,
              provider: ProviderEnum.GOOGLE,
              providerId: email,
            },
          });
        }
      }

      return {
        message: 'Xác thực Google thành công',
        user: {
          id: user.id,
          email: user.email,
          userName: user.userName,
        },
        accessToken,
      };
    } catch (error) {
      console.error('Lỗi khi xử lý Google Login:', error);
      throw new InternalServerErrorException('Lỗi máy chủ khi xử lý đăng nhập');
    }
  }
}
