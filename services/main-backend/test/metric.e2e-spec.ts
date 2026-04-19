import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { MetricService } from './../src/metric/metric.service';
import { PrismaService } from './../src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Metric API (e2e)', () => {
  let app: INestApplication<App>;
  let metricService: {
    getLatestMetric: jest.Mock;
    createMetric: jest.Mock;
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  let token: string;

  beforeEach(async () => {
    metricService = {
      getLatestMetric: jest.fn(),
      createMetric: jest.fn(),
    };

    const mockPrisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: userId,
          email: 'user@example.com',
          userName: 'John',
        }),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MetricService)
      .useValue(metricService)
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    const jwtService = moduleFixture.get(JwtService);
    token = jwtService.sign({ sub: userId, email: 'user@example.com' });

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/metrics/latest should return 200 for valid header', async () => {
    metricService.getLatestMetric.mockResolvedValue({
      id: 1,
      heightCm: 170,
      weightKg: 65,
      bmi: 22.49,
      recordedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    await request(app.getHttpServer())
      .get('/api/v1/metrics/latest')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(metricService.getLatestMetric).toHaveBeenCalledWith(userId);
  });

  it('GET /api/v1/metrics/latest should return 401 when token is missing', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/metrics/latest')
      .expect(401);
  });

  it('GET /api/v1/metrics/latest should return 404 when user is not found', async () => {
    metricService.getLatestMetric.mockRejectedValue(
      new NotFoundException('User not found.'),
    );

    await request(app.getHttpServer())
      .get('/api/v1/metrics/latest')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('POST /api/v1/metrics should return 201 for valid payload', async () => {
    metricService.createMetric.mockResolvedValue({
      id: 2,
      userId,
      heightCm: 170,
      weightKg: 65,
      bmi: 22.49,
      recordedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    await request(app.getHttpServer())
      .post('/api/v1/metrics')
      .set('Authorization', `Bearer ${token}`)
      .send({ heightCm: 170, weightKg: 65 })
      .expect(201);

    expect(metricService.createMetric).toHaveBeenCalledWith(userId, {
      heightCm: 170,
      weightKg: 65,
    });
  });

  it('POST /api/v1/metrics should return 422 for invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/metrics')
      .set('Authorization', `Bearer ${token}`)
      .send({ heightCm: -1, weightKg: 65 })
      .expect(422);
  });
});
