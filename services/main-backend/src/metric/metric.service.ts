import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  MetricCreate,
  MetricCreateResponseSchema,
  MetricResponseSchema,
} from '@meal/shared/types/metric';
import { Uuid } from '@meal/shared/types/common';

@Injectable()
export class MetricService {
  constructor(private readonly prisma: PrismaService) {}

  async getLatestMetric(userId: Uuid) {
    await this.assertUserExists(userId);

    const metric = await this.prisma.metric.findFirst({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
    });

    if (!metric) {
      return null;
    }

    const parsed = MetricResponseSchema.safeParse(metric);
    if (!parsed.success) {
      throw new InternalServerErrorException('Invalid metric data');
    }

    return parsed.data;
  }

  async createMetric(userId: Uuid, payload: MetricCreate) {
    await this.assertUserExists(userId);

    const { heightCm, weightKg } = payload;
    const bmi = weightKg / Math.pow(heightCm / 100, 2);

    const metric = await this.prisma.metric.create({
      data: {
        userId,
        heightCm,
        weightKg,
        bmi,
        recordedAt: new Date(),
      },
    });

    const parsed = MetricCreateResponseSchema.safeParse(metric);
    if (!parsed.success) {
      throw new InternalServerErrorException('Invalid metric data');
    }

    return parsed.data;
  }

  private async assertUserExists(userId: Uuid) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
  }
}
