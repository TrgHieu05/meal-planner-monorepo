import { INestApplication, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/database/prisma.service';
import { MealSearchService } from './../src/meal-search/meal-search.service';

describe('Meal Search API (e2e)', () => {
  let app: INestApplication<App>;
  let mealSearchService: {
    search: jest.Mock;
    getMealById: jest.Mock;
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  let token: string;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '7d';

    mealSearchService = {
      search: jest.fn(),
      getMealById: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MealSearchService)
      .useValue(mealSearchService)
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: userId,
            email: 'user@example.com',
            userName: 'John',
            gender: null,
            dateOfBirth: null,
            profile: null,
          }),
        },
      })
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

  it('GET /api/v1/meals should return 401 when token is missing', async () => {
    await request(app.getHttpServer()).get('/api/v1/meals?q=egg').expect(401);
  });

  it('GET /api/v1/meals should allow missing q and return 200', async () => {
    mealSearchService.search.mockResolvedValue({
      list: [
        {
          id: 1,
          name: 'Apple Salad',
          difficulty: 'easy',
          cook_time_min: 5,
          score: 0,
        },
      ],
      page: 1,
      pageSize: 10,
      total: 1,
      hasMore: false,
    });

    await request(app.getHttpServer())
      .get('/api/v1/meals')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(mealSearchService.search).toHaveBeenCalledWith({
      queryText: '',
      excludeIngredients: [],
      difficulty: undefined,
      cookingTimeMaxMins: undefined,
      page: 1,
      pageSize: 10,
    });
  });

  it('GET /api/v1/meals should parse query params and delegate to service', async () => {
    mealSearchService.search.mockResolvedValue({
      list: [
        {
          id: 1,
          name: 'Omelette',
          difficulty: 'easy',
          cook_time_min: 25,
          score: 2,
        },
      ],
      page: 1,
      pageSize: 10,
      total: 1,
      hasMore: false,
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/meals?q=egg&difficulty=easy&cookingTime=%3C30m&allergies=milk,peanut')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(mealSearchService.search).toHaveBeenCalledWith({
      queryText: 'egg',
      excludeIngredients: ['milk', 'peanut'],
      difficulty: 'easy',
      cookingTimeMaxMins: 30,
      page: 1,
      pageSize: 10,
    });

    expect(response.body.list[0]).toMatchObject({
      id: 1,
      name: 'Omelette',
      difficulty: 'easy',
      cook_time_min: 25,
    });
  });

  it('GET /api/v1/meals/:id should return 200 with meal detail', async () => {
    mealSearchService.getMealById.mockResolvedValue({
      id: 1,
      name: 'Omelette',
      meal_image_key: null,
      description: 'Tasty',
      cuisine_type: { id: 1, name: 'French', description: null },
      difficulty: 'easy',
      cook_time_min: 25,
      total_calories: 300,
      total_protein: 20,
      total_fat: 10,
      total_fiber: 2,
      ingredients: [{ id: 10, name: 'egg', quantity: 2 }],
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/meals/1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(mealSearchService.getMealById).toHaveBeenCalledWith(1);
    expect(response.body).toMatchObject({
      id: 1,
      name: 'Omelette',
      difficulty: 'easy',
      cook_time_min: 25,
    });
  });

  it('GET /api/v1/meals/:id should return 400 for invalid id', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/meals/0')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('GET /api/v1/meals/:id should return 404 when not found', async () => {
    mealSearchService.getMealById.mockRejectedValue(
      new NotFoundException('Meal not found.'),
    );

    await request(app.getHttpServer())
      .get('/api/v1/meals/999')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});
