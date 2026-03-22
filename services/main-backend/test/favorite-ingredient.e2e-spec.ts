import {
  ConflictException,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { FavoriteIngredientService } from './../src/favorite-ingredient/favorite-ingredient.service';
import { PrismaService } from './../src/database/prisma.service';

describe('Favorite Ingredient API (e2e)', () => {
  let app: INestApplication<App>;
  let favoriteIngredientService: {
    getFavoriteIngredient: jest.Mock;
    updateFavoriteIngredient: jest.Mock;
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(async () => {
    favoriteIngredientService = {
      getFavoriteIngredient: jest.fn(),
      updateFavoriteIngredient: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FavoriteIngredientService)
      .useValue(favoriteIngredientService)
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

  it('GET /api/v1/favorite-ingredients should return 200 for valid header', async () => {
    favoriteIngredientService.getFavoriteIngredient.mockResolvedValue({
      list: [{ name: 'Egg' }],
    });

    await request(app.getHttpServer())
      .get('/api/v1/favorite-ingredients')
      .set('x-user-id', userId)
      .expect(200);

    expect(
      favoriteIngredientService.getFavoriteIngredient,
    ).toHaveBeenCalledWith(userId);
  });

  it('GET /api/v1/favorite-ingredients should return 422 for invalid header', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/favorite-ingredients')
      .set('x-user-id', 'invalid-uuid')
      .expect(422);
  });

  it('GET /api/v1/favorite-ingredients should return 404 when user is not found', async () => {
    favoriteIngredientService.getFavoriteIngredient.mockRejectedValue(
      new NotFoundException('User not found.'),
    );

    await request(app.getHttpServer())
      .get('/api/v1/favorite-ingredients')
      .set('x-user-id', userId)
      .expect(404);
  });

  it('PATCH /api/v1/favorite-ingredients should return 200 for valid payload', async () => {
    favoriteIngredientService.updateFavoriteIngredient.mockResolvedValue({
      list: [{ name: 'Egg' }, { name: 'Milk' }],
    });

    await request(app.getHttpServer())
      .patch('/api/v1/favorite-ingredients')
      .set('x-user-id', userId)
      .send({ ingredientIds: [1, 2] })
      .expect(200);

    expect(
      favoriteIngredientService.updateFavoriteIngredient,
    ).toHaveBeenCalledWith(userId, {
      ingredientIds: [1, 2],
    });
  });

  it('PATCH /api/v1/favorite-ingredients should return 422 for invalid header', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/favorite-ingredients')
      .set('x-user-id', 'invalid-uuid')
      .send({ ingredientIds: [1] })
      .expect(422);
  });

  it('PATCH /api/v1/favorite-ingredients should return 422 for invalid payload', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/favorite-ingredients')
      .set('x-user-id', userId)
      .send({ ingredientIds: ['1'] })
      .expect(422);
  });

  it('PATCH /api/v1/favorite-ingredients should return 409 for conflict', async () => {
    favoriteIngredientService.updateFavoriteIngredient.mockRejectedValue(
      new ConflictException(
        'Favorite ingredient update conflicts with allergies: 2.',
      ),
    );

    await request(app.getHttpServer())
      .patch('/api/v1/favorite-ingredients')
      .set('x-user-id', userId)
      .send({ ingredientIds: [2] })
      .expect(409);
  });

  it('PATCH /api/v1/favorite-ingredients should return 404 when ingredient is not found', async () => {
    favoriteIngredientService.updateFavoriteIngredient.mockRejectedValue(
      new NotFoundException('Ingredients not found: 99.'),
    );

    await request(app.getHttpServer())
      .patch('/api/v1/favorite-ingredients')
      .set('x-user-id', userId)
      .send({ ingredientIds: [99] })
      .expect(404);
  });
});
