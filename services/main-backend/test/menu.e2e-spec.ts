import { ConflictException, INestApplication, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/database/prisma.service';
import { MenuService } from './../src/menu/menu.service';

describe('Menu API (e2e)', () => {
  let app: INestApplication<App>;
  let menuService: {
    getMenuByDay: jest.Mock;
    deleteMenuByDay: jest.Mock;
    createMenuItem: jest.Mock;
    updateMenuItem: jest.Mock;
    deleteMenuItem: jest.Mock;
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  let token: string;

  beforeEach(async () => {
    menuService = {
      getMenuByDay: jest.fn(),
      deleteMenuByDay: jest.fn(),
      createMenuItem: jest.fn(),
      updateMenuItem: jest.fn(),
      deleteMenuItem: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MenuService)
      .useValue(menuService)
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findUnique: jest.fn().mockResolvedValue({
            id: userId,
            email: 'user@example.com',
            userName: 'John',
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

  it('GET /api/v1/menus/day/:date should return 200 for valid token and date', async () => {
    menuService.getMenuByDay.mockResolvedValue({
      date: '2026-03-24',
      hasMenu: false,
      nutritionTotal: {
        calories: 0,
        protein: 0,
        fat: 0,
        fiber: 0,
      },
      meals: {
        BREAKFAST: [],
        LUNCH: [],
        DINNER: [],
      },
    });

    await request(app.getHttpServer())
      .get('/api/v1/menus/day/2026-03-24')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(menuService.getMenuByDay).toHaveBeenCalledWith(userId, '2026-03-24');
  });

  it('GET /api/v1/menus/day/:date should return list item fields required by the menu screen', async () => {
    menuService.getMenuByDay.mockResolvedValue({
      date: '2026-03-24',
      hasMenu: true,
      nutritionTotal: {
        calories: 1450,
        protein: 92,
        fat: 45,
        fiber: 26,
      },
      meals: {
        BREAKFAST: [
          {
            menuItemId: 101,
            mealId: 12,
            mealName: 'Overnight Oats',
            mealImageKey: 'meals/12/cover',
            mealImageUrls: {
              card: 'https://example.com/meals/12/cover/card',
              detail: 'https://example.com/meals/12/cover/detail',
              original: 'https://example.com/meals/12/cover/original',
            },
            portionSize: 1,
            eated: false,
            nutritionPerServing: {
              calories: 320,
              protein: 15,
              fat: 8,
              fiber: 6,
            },
          },
        ],
        LUNCH: [],
        DINNER: [],
      },
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/menus/day/2026-03-24')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.meals.BREAKFAST[0]).toMatchObject({
      menuItemId: 101,
      mealId: 12,
      mealName: 'Overnight Oats',
      mealImageKey: 'meals/12/cover',
      mealImageUrls: {
        card: 'https://example.com/meals/12/cover/card',
        detail: 'https://example.com/meals/12/cover/detail',
        original: 'https://example.com/meals/12/cover/original',
      },
      portionSize: 1,
      eated: false,
      nutritionPerServing: {
        calories: 320,
        protein: 15,
        fat: 8,
        fiber: 6,
      },
    });
  });

  it('GET /api/v1/menus/day/:date should return 401 when token is missing', async () => {
    await request(app.getHttpServer()).get('/api/v1/menus/day/2026-03-24').expect(401);
  });

  it('GET /api/v1/menus/day/:date should return 422 for invalid date format', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/menus/day/2026-3-24')
      .set('x-request-id', 'req-test-422')
      .set('Authorization', `Bearer ${token}`)
      .expect(422);

    expect(response.body).toMatchObject({
      requestId: 'req-test-422',
      code: 'MENU_VALIDATION_ERROR',
      message: 'Date path param is invalid. Expected format: YYYY-MM-DD.',
    });
    expect(typeof response.body.timestamp).toBe('string');
    expect(response.body.details).toBeDefined();
  });

  it('GET /api/v1/menus/day/:date should return 422 for invalid calendar date', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/menus/day/2026-02-30')
      .set('x-request-id', 'req-test-invalid-calendar')
      .set('Authorization', `Bearer ${token}`)
      .expect(422);

    expect(response.body).toMatchObject({
      requestId: 'req-test-invalid-calendar',
      code: 'MENU_VALIDATION_ERROR',
      message: 'Date path param must be a valid calendar date in YYYY-MM-DD format.',
    });
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('POST /api/v1/menu-items should return 201 for valid payload', async () => {
    menuService.createMenuItem.mockResolvedValue({
      id: 1,
      menuId: 10,
      mealId: 12,
      mealTime: 'BREAKFAST',
      eated: false,
      portionSize: 1,
    });

    await request(app.getHttpServer())
      .post('/api/v1/menu-items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-03-24',
        mealId: 12,
        mealTime: 'BREAKFAST',
        portionSize: 1,
      })
      .expect(201);

    expect(menuService.createMenuItem).toHaveBeenCalledWith(userId, {
      date: '2026-03-24',
      mealId: 12,
      mealTime: 'BREAKFAST',
      portionSize: 1,
    });
  });

  it('POST /api/v1/menu-items should return 422 for invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/menu-items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-03-24',
        mealId: 12,
        mealTime: 'BREAKFAST',
        portionSize: -1,
      })
      .expect(422);
  });

  it('POST /api/v1/menu-items should return 422 for invalid calendar date in body', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/menu-items')
      .set('x-request-id', 'req-test-post-invalid-calendar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-02-30',
        mealId: 12,
        mealTime: 'BREAKFAST',
        portionSize: 1,
      })
      .expect(422);

    expect(response.body).toMatchObject({
      requestId: 'req-test-post-invalid-calendar',
      code: 'MENU_VALIDATION_ERROR',
      message: 'Body field "date" must be a valid calendar date in YYYY-MM-DD format.',
    });
  });

  it('POST /api/v1/menu-items should return 404 when meal is not found', async () => {
    menuService.createMenuItem.mockRejectedValue(new NotFoundException('Meal not found.'));

    const response = await request(app.getHttpServer())
      .post('/api/v1/menu-items')
      .set('x-request-id', 'req-test-404')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-03-24',
        mealId: 999,
        mealTime: 'BREAKFAST',
        portionSize: 1,
      })
      .expect(404);

    expect(response.body).toMatchObject({
      requestId: 'req-test-404',
      code: 'MENU_NOT_FOUND',
      message: 'Meal not found.',
    });
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('POST /api/v1/menu-items should return 409 when duplicated meal exists in same day and meal time', async () => {
    menuService.createMenuItem.mockRejectedValue(
      new ConflictException('Menu item already exists for the selected meal and meal time.'),
    );

    const response = await request(app.getHttpServer())
      .post('/api/v1/menu-items')
      .set('x-request-id', 'req-test-409')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: '2026-03-24',
        mealId: 12,
        mealTime: 'BREAKFAST',
        portionSize: 1,
      })
      .expect(409);

    expect(response.body).toMatchObject({
      requestId: 'req-test-409',
      code: 'MENU_CONFLICT',
      message: 'Menu item already exists for the selected meal and meal time.',
    });
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('POST /api/v1/menu-items concurrent requests should return one success and one conflict', async () => {
    menuService.createMenuItem
      .mockResolvedValueOnce({
        id: 1,
        menuId: 10,
        mealId: 12,
        mealTime: 'BREAKFAST',
        eated: false,
        portionSize: 1,
      })
      .mockRejectedValueOnce(
        new ConflictException('Menu item already exists for the selected meal and meal time.'),
      );

    const payload = {
      date: '2026-03-24',
      mealId: 12,
      mealTime: 'BREAKFAST',
      portionSize: 1,
    };

    const [first, second] = await Promise.all([
      request(app.getHttpServer())
        .post('/api/v1/menu-items')
        .set('Authorization', `Bearer ${token}`)
        .send(payload),
      request(app.getHttpServer())
        .post('/api/v1/menu-items')
        .set('Authorization', `Bearer ${token}`)
        .send(payload),
    ]);

    const statuses = [first.status, second.status].sort((a, b) => a - b);
    expect(statuses).toEqual([201, 409]);
  });

  it('DELETE /api/v1/menus/day/:date should return 204 when delete succeeds', async () => {
    menuService.deleteMenuByDay.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .delete('/api/v1/menus/day/2026-03-24')
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    expect(menuService.deleteMenuByDay).toHaveBeenCalledWith(userId, '2026-03-24');
  });

  it('DELETE /api/v1/menus/day/:date should return 204 when day is already empty (idempotent)', async () => {
    menuService.deleteMenuByDay.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .delete('/api/v1/menus/day/2026-03-24')
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });

  it('PATCH /api/v1/menu-items/:id should return 200 for valid payload', async () => {
    menuService.updateMenuItem.mockResolvedValue({
      id: 1,
      menuId: 10,
      mealId: 12,
      mealTime: 'BREAKFAST',
      eated: true,
      portionSize: 1.5,
    });

    await request(app.getHttpServer())
      .patch('/api/v1/menu-items/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ portionSize: 1.5, eated: true })
      .expect(200);

    expect(menuService.updateMenuItem).toHaveBeenCalledWith(userId, 1, {
      portionSize: 1.5,
      eated: true,
    });
  });

  it('PATCH /api/v1/menu-items/:id should return 422 for invalid id', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/menu-items/abc')
      .set('Authorization', `Bearer ${token}`)
      .send({ portionSize: 1.5 })
      .expect(422);
  });

  it('PATCH /api/v1/menu-items/:id should return 422 for empty payload', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/menu-items/1')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(422);
  });

  it('PATCH /api/v1/menu-items/:id should return 404 when item is not found or not owned', async () => {
    menuService.updateMenuItem.mockRejectedValue(
      new NotFoundException('Menu item not found.'),
    );

    await request(app.getHttpServer())
      .patch('/api/v1/menu-items/999')
      .set('Authorization', `Bearer ${token}`)
      .send({ portionSize: 1.5 })
      .expect(404);
  });

  it('DELETE /api/v1/menu-items/:id should return 204 for existing owned item', async () => {
    menuService.deleteMenuItem.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .delete('/api/v1/menu-items/1')
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    expect(menuService.deleteMenuItem).toHaveBeenCalledWith(userId, 1);
  });

  it('DELETE /api/v1/menu-items/:id should return 422 for invalid id', async () => {
    await request(app.getHttpServer())
      .delete('/api/v1/menu-items/invalid-id')
      .set('Authorization', `Bearer ${token}`)
      .expect(422);
  });

  it('DELETE /api/v1/menu-items/:id should return 404 when item is not found or not owned', async () => {
    menuService.deleteMenuItem.mockRejectedValue(
      new NotFoundException('Menu item not found.'),
    );

    await request(app.getHttpServer())
      .delete('/api/v1/menu-items/999')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});
