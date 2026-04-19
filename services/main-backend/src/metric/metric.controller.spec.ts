import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { MetricController } from './metric.controller';
import { MetricService } from './metric.service';

describe('MetricController', () => {
  let controller: MetricController;
  let metricService: {
    getLatestMetric: jest.Mock;
    createMetric: jest.Mock;
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(async () => {
    metricService = {
      getLatestMetric: jest.fn(),
      createMetric: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricController],
      providers: [
        {
          provide: MetricService,
          useValue: metricService,
        },
      ],
    }).compile();

    controller = module.get<MetricController>(MetricController);
  });

  describe('getLatestMetric', () => {
    it('should read user from request and call service', async () => {
      metricService.getLatestMetric.mockResolvedValue(null);

      await controller.getLatestMetric({ user: { id: userId } });

      expect(metricService.getLatestMetric).toHaveBeenCalledWith(userId);
    });

    it('should throw when user is missing', () => {
      expect(() => controller.getLatestMetric({})).toThrow(
        UnauthorizedException,
      );
      expect(metricService.getLatestMetric).not.toHaveBeenCalled();
    });
  });

  describe('createMetric', () => {
    it('should parse input and call service', async () => {
      const payload = { heightCm: 170, weightKg: 65 };
      metricService.createMetric.mockResolvedValue({
        id: 1,
        userId,
        ...payload,
        bmi: 22.49,
        recordedAt: new Date(),
      });

      await controller.createMetric({ user: { id: userId } }, payload);

      expect(metricService.createMetric).toHaveBeenCalledWith(userId, payload);
    });

    it('should throw when body is invalid', () => {
      expect(() =>
        controller.createMetric(
          { user: { id: userId } },
          {
            heightCm: -1,
          },
        ),
      ).toThrow(UnprocessableEntityException);
      expect(metricService.createMetric).not.toHaveBeenCalled();
    });
  });
});
