import {
  INestApplication,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { OptionsService } from './../src/options/options.service';
import { PrismaService } from './../src/database/prisma.service';

describe('Options API (e2e)', () => {
  let app: INestApplication<App>;
  let optionsService: {
    getDietTypes: jest.Mock;
    getDietTypeById: jest.Mock;
    getGoals: jest.Mock;
    getGoalById: jest.Mock;
    getCuisineTypes: jest.Mock;
    getCuisineTypeById: jest.Mock;
  };

  beforeEach(async () => {
    optionsService = {
      getDietTypes: jest.fn(),
      getDietTypeById: jest.fn(),
      getGoals: jest.fn(),
      getGoalById: jest.fn(),
      getCuisineTypes: jest.fn(),
      getCuisineTypeById: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(OptionsService)
      .useValue(optionsService)
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/options/diet-types should return 200 with cache headers', async () => {
    optionsService.getDietTypes.mockResolvedValue([]);

    const response = await request(app.getHttpServer())
      .get('/api/v1/options/diet-types')
      .expect(200);

    expect(response.headers['x-api-version']).toBe('v1');
    expect(response.headers['cache-control']).toContain('public');
    expect(response.headers['cache-control']).toContain('max-age=300');
  });

  it('GET /api/v1/options/diet-types should return 500 when service throws', async () => {
    optionsService.getDietTypes.mockRejectedValue(
      new InternalServerErrorException('Invalid diet types data'),
    );

    await request(app.getHttpServer())
      .get('/api/v1/options/diet-types')
      .expect(500);
  });

  it('GET /api/v1/options/diet-types/:id should return 200 for valid id', async () => {
    optionsService.getDietTypeById.mockResolvedValue({
      id: 1,
      name: 'Keto',
      description: null,
    });

    await request(app.getHttpServer())
      .get('/api/v1/options/diet-types/1')
      .expect(200);
  });

  it('GET /api/v1/options/diet-types/:id should return 422 for invalid id', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/options/diet-types/abc')
      .expect(422);
  });

  it('GET /api/v1/options/diet-types/:id should return 404 when option not found', async () => {
    optionsService.getDietTypeById.mockRejectedValue(
      new NotFoundException('Diet type not found.'),
    );

    await request(app.getHttpServer())
      .get('/api/v1/options/diet-types/99')
      .expect(404);
  });

  it('GET /api/v1/options/goals should return 200 with cache headers', async () => {
    optionsService.getGoals.mockResolvedValue([]);

    const response = await request(app.getHttpServer())
      .get('/api/v1/options/goals')
      .expect(200);

    expect(response.headers['x-api-version']).toBe('v1');
    expect(response.headers['cache-control']).toContain('public');
    expect(response.headers['cache-control']).toContain('max-age=300');
  });

  it('GET /api/v1/options/goals should return 500 when service throws', async () => {
    optionsService.getGoals.mockRejectedValue(
      new InternalServerErrorException('Invalid goals data'),
    );

    await request(app.getHttpServer()).get('/api/v1/options/goals').expect(500);
  });

  it('GET /api/v1/options/goals/:id should return 200 for valid id', async () => {
    optionsService.getGoalById.mockResolvedValue({
      id: 1,
      name: 'Maintain',
      description: null,
    });

    await request(app.getHttpServer())
      .get('/api/v1/options/goals/1')
      .expect(200);
  });

  it('GET /api/v1/options/goals/:id should return 422 for invalid id', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/options/goals/0')
      .expect(422);
  });

  it('GET /api/v1/options/goals/:id should return 404 when option not found', async () => {
    optionsService.getGoalById.mockRejectedValue(
      new NotFoundException('Goal not found.'),
    );

    await request(app.getHttpServer())
      .get('/api/v1/options/goals/99')
      .expect(404);
  });

  it('GET /api/v1/options/cuisine-types should return 200 with cache headers', async () => {
    optionsService.getCuisineTypes.mockResolvedValue([]);

    const response = await request(app.getHttpServer())
      .get('/api/v1/options/cuisine-types')
      .expect(200);

    expect(response.headers['x-api-version']).toBe('v1');
    expect(response.headers['cache-control']).toContain('public');
    expect(response.headers['cache-control']).toContain('max-age=300');
  });

  it('GET /api/v1/options/cuisine-types should return 500 when service throws', async () => {
    optionsService.getCuisineTypes.mockRejectedValue(
      new InternalServerErrorException('Invalid cuisine types data'),
    );

    await request(app.getHttpServer())
      .get('/api/v1/options/cuisine-types')
      .expect(500);
  });

  it('GET /api/v1/options/cuisine-types/:id should return 200 for valid id', async () => {
    optionsService.getCuisineTypeById.mockResolvedValue({
      id: 1,
      name: 'Vietnamese',
      description: null,
    });

    await request(app.getHttpServer())
      .get('/api/v1/options/cuisine-types/1')
      .expect(200);
  });

  it('GET /api/v1/options/cuisine-types/:id should return 422 for invalid id', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/options/cuisine-types/-1')
      .expect(422);
  });

  it('GET /api/v1/options/cuisine-types/:id should return 404 when option not found', async () => {
    optionsService.getCuisineTypeById.mockRejectedValue(
      new NotFoundException('Cuisine type not found.'),
    );

    await request(app.getHttpServer())
      .get('/api/v1/options/cuisine-types/99')
      .expect(404);
  });
});
