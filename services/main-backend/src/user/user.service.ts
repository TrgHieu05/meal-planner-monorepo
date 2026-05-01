import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserUpdate, UserResponseSchema } from '@meal/shared/types/user';
import { Uuid } from '@meal/shared/types/common';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUser(id: Uuid) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const parsed = UserResponseSchema.safeParse(user);
    if (!parsed.success) {
      throw new InternalServerErrorException('Failed to parse user');
    }

    return parsed.data;
  }

  async updateUser(id: Uuid, payload: UserUpdate) {
    const user = await this.prisma.user.update({
      where: {
        id,
      },
      data: payload,
    });

    if (!user) {
      throw new InternalServerErrorException('Failed to update user');
    }

    const parsed = UserResponseSchema.safeParse(user);
    if (!parsed.success) {
      throw new InternalServerErrorException('Failed to parse user');
    }

    return parsed.data;
  }
}
