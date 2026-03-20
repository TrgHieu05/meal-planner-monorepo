import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  MetricCreateSchema,
  MetricCreate,
  MetricSchema,
} from '@meal/shared/types/metric';
import { Uuid } from '@meal/shared/types/common';

@Injectable()
export class MetricService {
  constructor(private readonly prisma: PrismaService) {}

  async getLatestMetric(userId: Uuid) {
    const metric = await this.prisma.metric.findFirst({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
    });

    if (!metric) {
      return null;
    }

    const parsed = MetricSchema.safeParse(metric);
    if (!parsed.success) {
      throw new InternalServerErrorException('Invalid metric data');
    }

    return parsed.data;
  }

  async createMetric(userId: Uuid, payload: MetricCreate) {
    const parsedPayload = MetricCreateSchema.safeParse(payload);
    if (!parsedPayload.success) {
      throw new BadRequestException(parsedPayload.error);
    }

    const { heightCm, weightKg } = parsedPayload.data;
    if (!heightCm || !weightKg) {
      throw new BadRequestException('Height (Cm) and weight (Kg) are required');
    }

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

    const parsed = MetricSchema.safeParse(metric);
    if (!parsed.success) {
      throw new InternalServerErrorException('Invalid metric data');
    }

    return parsed.data;
  }
}
