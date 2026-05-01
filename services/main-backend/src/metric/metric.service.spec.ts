import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MetricService } from './metric.service';
import { PrismaService } from '../database/prisma.service';

describe('MetricService', () => {
  let service: MetricService;
  let prisma: {
    user: { findUnique: jest.Mock };
    metric: { findFirst: jest.Mock; create: jest.Mock };
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      metric: { findFirst: jest.fn(), create: jest.fn() },
    };
    service = new MetricService(prisma as unknown as PrismaService);
  });

  describe('getLatestMetric', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getLatestMetric(userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.metric.findFirst).not.toHaveBeenCalled();
    });

    it('should return null when no metric exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.metric.findFirst.mockResolvedValue(null);

      const result = await service.getLatestMetric(userId);

      expect(result).toBeNull();
    });

    it('should return latest metric response when data is valid', async () => {
      const metric = {
        id: 1,
        userId,
        heightCm: 175,
        weightKg: 70,
        bmi: 22.86,
        recordedAt: new Date('2026-01-01T00:00:00.000Z'),
      };
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.metric.findFirst.mockResolvedValue(metric);

      const result = await service.getLatestMetric(userId);

      expect(result).toEqual({
        id: metric.id,
        heightCm: metric.heightCm,
        weightKg: metric.weightKg,
        bmi: metric.bmi,
        recordedAt: metric.recordedAt,
      });
    });

    it('should throw InternalServerErrorException when metric shape is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.metric.findFirst.mockResolvedValue({
        id: 1,
        userId,
        heightCm: 170,
        weightKg: 60,
        bmi: 20.76,
        recordedAt: 'invalid-date',
      });

      await expect(service.getLatestMetric(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('createMetric', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.createMetric(userId, { heightCm: 170, weightKg: 65 }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.metric.create).not.toHaveBeenCalled();
    });

    it('should calculate bmi and create metric', async () => {
      const payload = { heightCm: 170, weightKg: 65 };
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.metric.create.mockImplementation(
        ({
          data,
        }: {
          data: {
            userId: string;
            heightCm: number;
            weightKg: number;
            bmi: number;
            recordedAt: Date;
          };
        }) => {
          return {
            id: 10,
            ...data,
          };
        },
      );

      const result = await service.createMetric(userId, payload);

      expect(prisma.metric.create).toHaveBeenCalled();
      const createCall = prisma.metric.create.mock.calls[0] as
        | [
            {
              data: {
                userId: string;
                heightCm: number;
                weightKg: number;
                bmi: number;
                recordedAt: Date;
              };
            },
          ]
        | undefined;
      if (!createCall) {
        throw new Error('Expected prisma.metric.create to be called');
      }
      const [createInput] = createCall;
      expect(createInput.data.userId).toBe(userId);
      expect(createInput.data.heightCm).toBe(170);
      expect(createInput.data.weightKg).toBe(65);
      expect(createInput.data.bmi).toBeCloseTo(22.49134948096886, 10);
      expect(result).toEqual({
        id: 10,
        heightCm: 170,
        weightKg: 65,
        bmi: createInput.data.bmi,
        recordedAt: createInput.data.recordedAt,
      });
      expect(result.bmi).toBeCloseTo(22.49134948096886, 10);
    });

    it('should throw InternalServerErrorException when created metric is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.metric.create.mockResolvedValue({
        id: 10,
        userId,
        heightCm: 170,
        weightKg: 65,
        bmi: 22.49,
        recordedAt: 'invalid-date',
      });

      await expect(
        service.createMetric(userId, { heightCm: 170, weightKg: 65 }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
