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
  const templateId = '550e8400-e29b-41d4-a716-446655440001';
  const itemId = '550e8400-e29b-41d4-a716-446655440010';

  beforeEach(async () => {
    service = {
      createTemplate: jest.fn(),
      getTemplates: jest.fn(),
      getTemplateDetail: jest.fn(),
      createTemplateImageUploadSignature: jest.fn(),
      applyTemplate: jest.fn(),
      updateTemplate: jest.fn(),
      updateTemplateImage: jest.fn(),
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
          templateImageKey: 'templates/550e8400-e29b-41d4-a716-446655440001/cover',
          templateImageUrls: {
            card: 'https://example.com/templates/550e8400-e29b-41d4-a716-446655440001/cover/card',
            detail: 'https://example.com/templates/550e8400-e29b-41d4-a716-446655440001/cover/detail',
            original: 'https://example.com/templates/550e8400-e29b-41d4-a716-446655440001/cover/original',
          },
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
    expect(res.body.list[0]).toMatchObject({
      templateImageKey: 'templates/550e8400-e29b-41d4-a716-446655440001/cover',
      templateImageUrls: {
        card: 'https://example.com/templates/550e8400-e29b-41d4-a716-446655440001/cover/card',
        detail: 'https://example.com/templates/550e8400-e29b-41d4-a716-446655440001/cover/detail',
        original: 'https://example.com/templates/550e8400-e29b-41d4-a716-446655440001/cover/original',
      },
    });
    expect(service.getTemplates).toHaveBeenCalledWith(userId);
  });

  it('POST /api/v1/meal-templates/:id/apply should return 200', async () => {
    service.applyTemplate.mockResolvedValue({
      templateId,
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
      .post(`/api/v1/meal-templates/${templateId}/apply`)
      .set('Authorization', `Bearer ${token}`)
      .send({ startDate: '2026-05-10' })
      .expect(200);

    expect(res.body.appliedDayCount).toBe(3);
    expect(service.applyTemplate).toHaveBeenCalledWith(
      userId,
      templateId,
      { startDate: '2026-05-10', replaceExistingMeals: true },
    );
  });

  it('GET /api/v1/meal-templates/:id should return 200', async () => {
    service.getTemplateDetail.mockResolvedValue({
      id: templateId,
      name: 'T1',
      templateImageKey: 'templates/550e8400-e29b-41d4-a716-446655440001/cover',
      templateImageUrls: {
        card: 'https://example.com/templates/550e8400-e29b-41d4-a716-446655440001/cover/card',
        detail: 'https://example.com/templates/550e8400-e29b-41d4-a716-446655440001/cover/detail',
        original: 'https://example.com/templates/550e8400-e29b-41d4-a716-446655440001/cover/original',
      },
      description: 'Template detail',
      nutritionTotal: { calories: 800, protein: 45, fat: 25, fiber: 8 },
      days: [
        {
          dayNumber: 1,
          nutritionTotal: { calories: 800, protein: 45, fat: 25, fiber: 8 },
          meals: {
            BREAKFAST: [],
            LUNCH: [],
            DINNER: [],
          },
        },
      ],
    });

    const res = await request(app.getHttpServer())
      .get(`/api/v1/meal-templates/${templateId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toMatchObject({
      id: templateId,
      templateImageKey: 'templates/550e8400-e29b-41d4-a716-446655440001/cover',
      templateImageUrls: {
        card: 'https://example.com/templates/550e8400-e29b-41d4-a716-446655440001/cover/card',
        detail: 'https://example.com/templates/550e8400-e29b-41d4-a716-446655440001/cover/detail',
        original: 'https://example.com/templates/550e8400-e29b-41d4-a716-446655440001/cover/original',
      },
    });
    expect(service.getTemplateDetail).toHaveBeenCalledWith(userId, templateId);
  });

  it('PATCH /api/v1/meal-templates/:id should return 200', async () => {
    service.updateTemplate.mockResolvedValue({
      id: templateId,
      name: 'Updated Template',
      description: 'Updated description',
    });

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/meal-templates/${templateId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Template', description: 'Updated description' })
      .expect(200);

    expect(res.body.name).toBe('Updated Template');
    expect(service.updateTemplate).toHaveBeenCalledWith(userId, templateId, {
      name: 'Updated Template',
      description: 'Updated description',
    });
  });

  it('POST /api/v1/meal-templates/:id/image/upload-signature should return 200', async () => {
    service.createTemplateImageUploadSignature.mockResolvedValue({
      uploadUrl: 'https://api.cloudinary.com/v1_1/kitchen-mind/image/upload',
      cloudName: 'kitchen-mind',
      apiKey: 'api-key',
      timestamp: 1234567890,
      folder: 'templates',
      publicId: 'templates/550e8400-e29b-41d4-a716-446655440001/cover',
      signature: 'signed-payload',
      resourceType: 'image',
      overwrite: true,
      invalidate: true,
      allowedFormats: ['jpg', 'jpeg', 'png'],
      maxFileSizeBytes: 5242880,
    });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/meal-templates/${templateId}/image/upload-signature`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        entityType: 'template',
        entityId: templateId,
        mimeType: 'image/png',
      })
      .expect(200);

    expect(res.body.publicId).toBe('templates/550e8400-e29b-41d4-a716-446655440001/cover');
    expect(service.createTemplateImageUploadSignature).toHaveBeenCalledWith(userId, templateId, {
      entityType: 'template',
      entityId: templateId,
      mimeType: 'image/png',
    });
  });

  it('PATCH /api/v1/meal-templates/:id/image should return 204', async () => {
    service.updateTemplateImage.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .patch(`/api/v1/meal-templates/${templateId}/image`)
      .set('Authorization', `Bearer ${token}`)
      .send({ templateImageKey: null })
      .expect(204);

    expect(service.updateTemplateImage).toHaveBeenCalledWith(userId, templateId, {
      templateImageKey: null,
    });
  });

  it('DELETE /api/v1/meal-templates/:id should return 204', async () => {
    service.deleteTemplate.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .delete(`/api/v1/meal-templates/${templateId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    expect(service.deleteTemplate).toHaveBeenCalledWith(userId, templateId);
  });

  it('PUT /api/v1/meal-templates/:id/days/:dayNumber should return 201', async () => {
    service.upsertDay.mockResolvedValue(undefined);

    const res = await request(app.getHttpServer())
      .put(`/api/v1/meal-templates/${templateId}/days/2`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        meals: {
          BREAKFAST: [{ mealId: 11, portionSize: 1 }],
          LUNCH: [],
          DINNER: [{ mealId: 33, portionSize: 1.5 }],
        },
      })
      .expect(201);

    expect(res.body).toEqual({ success: true });
    expect(service.upsertDay).toHaveBeenCalledWith(userId, templateId, 2, {
      meals: {
        BREAKFAST: [{ mealId: 11, portionSize: 1 }],
        LUNCH: [],
        DINNER: [{ mealId: 33, portionSize: 1.5 }],
      },
    });
  });

  it('POST /api/v1/meal-templates/:id/items should return 201', async () => {
    service.addItem.mockResolvedValue({
      itemId,
      mealId: 33,
      mealName: 'Tofu Stir Fry',
      portionSize: 1.5,
      nutritionPerServing: { calories: 560, protein: 27, fat: 20, fiber: 11 },
    });

    const res = await request(app.getHttpServer())
      .post(`/api/v1/meal-templates/${templateId}/items`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        dayNumber: 2,
        mealId: 33,
        mealTime: 'DINNER',
        portionSize: 1.5,
      })
      .expect(201);

    expect(res.body.itemId).toBe(itemId);
    expect(service.addItem).toHaveBeenCalledWith(userId, templateId, {
      dayNumber: 2,
      mealId: 33,
      mealTime: 'DINNER',
      portionSize: 1.5,
    });
  });

  it('PATCH /api/v1/meal-templates/:id/items/:itemId should return 200', async () => {
    service.updateItem.mockResolvedValue({
      itemId,
      mealId: 33,
      mealName: 'Tofu Stir Fry',
      portionSize: 2,
      nutritionPerServing: { calories: 560, protein: 27, fat: 20, fiber: 11 },
    });

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/meal-templates/${templateId}/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ portionSize: 2 })
      .expect(200);

    expect(res.body.portionSize).toBe(2);
    expect(service.updateItem).toHaveBeenCalledWith(userId, templateId, itemId, {
      portionSize: 2,
    });
  });

  it('DELETE /api/v1/meal-templates/:id/items/:itemId should return 204', async () => {
    service.deleteItem.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .delete(`/api/v1/meal-templates/${templateId}/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    expect(service.deleteItem).toHaveBeenCalledWith(userId, templateId, itemId);
  });

  it('DELETE /api/v1/meal-templates/:id/days/:dayNumber should return 204', async () => {
    service.deleteDay.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .delete(`/api/v1/meal-templates/${templateId}/days/2`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    expect(service.deleteDay).toHaveBeenCalledWith(userId, templateId, 2);
  });
});
