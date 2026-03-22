import { INestApplication, InternalServerErrorException } from '@nestjs/common';
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
    getGoals: jest.Mock;
    getCuisineTypes: jest.Mock;
  };

  beforeEach(async () => {
    optionsService = {
      getDietTypes: jest.fn(),
      getGoals: jest.fn(),
      getCuisineTypes: jest.fn(),
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
});
