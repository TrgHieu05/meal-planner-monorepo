import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { MealTemplateService } from '../src/meal-template/meal-template.service';
import { PrismaService } from '../src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('MealTemplate API (e2e)', () => {
  let app: INestApplication;
  let service: any;
  let token: string;
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(async () => {
    service = {
      createTemplate: jest.fn(),
      getTemplates: jest.fn(),
      getTemplateDetail: jest.fn(),
      applyTemplate: jest.fn(),
      updateTemplate: jest.fn(),
      deleteTemplate: jest.fn(),
      upsertDay: jest.fn(),
      addItem: jest.fn(),
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      deleteDay: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MealTemplateService)
      .useValue(service)
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
    token = jwtService.sign({ sub: userId });

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /api/v1/meal-templates should return 201', async () => {
    service.createTemplate.mockResolvedValue({ id: 'uuid-1', name: 'T1' });

    const res = await request(app.getHttpServer())
      .post('/api/v1/meal-templates')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'T1' })
      .expect(201);

    expect(res.body.id).toBe('uuid-1');
    expect(service.createTemplate).toHaveBeenCalledWith(userId, { name: 'T1' });
  });

  it('GET /api/v1/meal-templates should return 200', async () => {
    service.getTemplates.mockResolvedValue({
      list: [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'T1',
          dayCount: 1,
          nutritionTotal: { calories: 100, protein: 10, fat: 5, fiber: 2 },
        },
      ],
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/meal-templates')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.list).toHaveLength(1);
    expect(service.getTemplates).toHaveBeenCalledWith(userId);
  });

  it('POST /api/v1/meal-templates/:id/apply should return 200', async () => {
    service.applyTemplate.mockResolvedValue({
      templateId: '550e8400-e29b-41d4-a716-446655440001',
      startDate: '2026-05-10',
      endDate: '2026-05-12',
      appliedDayCount: 3,
      replaceExistingMeals: true,
      createdMenuCount: 2,
      updatedMenuCount: 1,
      deletedMenuCount: 0,
      createdItemCount: 6,
      skippedExistingItemCount: 0,
    });

    const res = await request(app.getHttpServer())
      .post('/api/v1/meal-templates/550e8400-e29b-41d4-a716-446655440001/apply')
      .set('Authorization', `Bearer ${token}`)
      .send({ startDate: '2026-05-10' })
      .expect(200);

    expect(res.body.appliedDayCount).toBe(3);
    expect(service.applyTemplate).toHaveBeenCalledWith(
      userId,
      '550e8400-e29b-41d4-a716-446655440001',
      { startDate: '2026-05-10', replaceExistingMeals: true },
    );
  });
});
