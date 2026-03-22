import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ProfileService } from './../src/profile/profile.service';
import { PrismaService } from './../src/database/prisma.service';

describe('Profile API (e2e)', () => {
  let app: INestApplication<App>;
  let profileService: {
    getFullProfile: jest.Mock;
    getProfile: jest.Mock;
    updateProfile: jest.Mock;
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(async () => {
    profileService = {
      getFullProfile: jest.fn(),
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ProfileService)
      .useValue(profileService)
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

  it('GET /api/v1/profile/overview should return 200 for valid header', async () => {
    profileService.getFullProfile.mockResolvedValue({});

    await request(app.getHttpServer())
      .get('/api/v1/profile/overview')
      .set('user-id', userId)
      .expect(200);

    expect(profileService.getFullProfile).toHaveBeenCalledWith(userId);
  });

  it('GET /api/v1/profile/overview should return 422 for invalid header', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/profile/overview')
      .set('user-id', 'invalid-uuid')
      .expect(422);
  });

  it('GET /api/v1/profile/overview should return 404 when not found', async () => {
    profileService.getFullProfile.mockRejectedValue(
      new NotFoundException('Profile not found for the current user.'),
    );

    await request(app.getHttpServer())
      .get('/api/v1/profile/overview')
      .set('user-id', userId)
      .expect(404);
  });

  it('GET /api/v1/profile should return 200 for valid header', async () => {
    profileService.getProfile.mockResolvedValue({
      dietTypeId: 1,
      goalId: 2,
      cuisineTypeId: 3,
      targetCalories: null,
      activityLevel: null,
    });

    await request(app.getHttpServer())
      .get('/api/v1/profile')
      .set('user-id', userId)
      .expect(200);

    expect(profileService.getProfile).toHaveBeenCalledWith(userId);
  });

  it('GET /api/v1/profile should return 422 for invalid header', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/profile')
      .set('user-id', 'invalid-uuid')
      .expect(422);
  });

  it('GET /api/v1/profile should return 404 when not found', async () => {
    profileService.getProfile.mockRejectedValue(
      new NotFoundException('Profile not found for the current user.'),
    );

    await request(app.getHttpServer())
      .get('/api/v1/profile')
      .set('user-id', userId)
      .expect(404);
  });

  it('PATCH /api/v1/profile should return 200 for valid payload', async () => {
    profileService.updateProfile.mockResolvedValue({
      dietTypeId: 1,
      goalId: 2,
      cuisineTypeId: 3,
      targetCalories: null,
      activityLevel: null,
    });

    await request(app.getHttpServer())
      .patch('/api/v1/profile')
      .set('user-id', userId)
      .send({ dietTypeId: 1, goalId: 2, cuisineTypeId: 3 })
      .expect(200);

    expect(profileService.updateProfile).toHaveBeenCalledWith(userId, {
      dietTypeId: 1,
      goalId: 2,
      cuisineTypeId: 3,
    });
  });

  it('PATCH /api/v1/profile should return 422 for invalid header', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/profile')
      .set('user-id', 'invalid-uuid')
      .send({ dietTypeId: 1 })
      .expect(422);
  });

  it('PATCH /api/v1/profile should return 422 for invalid payload', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/profile')
      .set('user-id', userId)
      .send({ activityLevel: 'INVALID' })
      .expect(422);
  });

  it('PATCH /api/v1/profile should return 404 when user or profile not found', async () => {
    profileService.updateProfile.mockRejectedValue(
      new NotFoundException('Profile not found for the current user.'),
    );

    await request(app.getHttpServer())
      .patch('/api/v1/profile')
      .set('user-id', userId)
      .send({ goalId: 999 })
      .expect(404);
  });
});
