import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { IngredientService } from './../src/ingredient/ingredient.service';

describe('Ingredient API (e2e)', () => {
  let app: INestApplication<App>;
  let ingredientService: {
    getCatalog: jest.Mock;
  };

  beforeEach(async () => {
    ingredientService = {
      getCatalog: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(IngredientService)
      .useValue(ingredientService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/ingredients should return 200 with default query', async () => {
    ingredientService.getCatalog.mockResolvedValue({
      items: [{ id: 1, name: 'Egg' }],
      page: 1,
      pageSize: 30,
      total: 1,
      hasMore: false,
    });

    await request(app.getHttpServer()).get('/api/v1/ingredients').expect(200);

    expect(ingredientService.getCatalog).toHaveBeenCalledWith({
      q: '',
      page: 1,
      pageSize: 30,
    });
  });

  it('GET /api/v1/ingredients should parse browse/search query params', async () => {
    ingredientService.getCatalog.mockResolvedValue({
      items: [{ id: 31, name: 'Eggplant' }],
      page: 2,
      pageSize: 30,
      total: 31,
      hasMore: false,
    });

    await request(app.getHttpServer())
      .get('/api/v1/ingredients?q=egg&page=2&pageSize=30')
      .expect(200);

    expect(ingredientService.getCatalog).toHaveBeenCalledWith({
      q: 'egg',
      page: 2,
      pageSize: 30,
    });
  });

  it('GET /api/v1/ingredients should return 422 for invalid pageSize', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/ingredients?pageSize=10')
      .expect(422);
  });
});