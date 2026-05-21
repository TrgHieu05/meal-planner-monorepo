import {
  ConflictException,
  INestApplication,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ProfileService } from './../src/profile/profile.service';
import { PrismaService } from './../src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Profile API (e2e)', () => {
  let app: INestApplication<App>;
  let profileService: {
    createProfile: jest.Mock;
    getFullProfile: jest.Mock;
    getProfile: jest.Mock;
    updateProfile: jest.Mock;
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  let token: string;

  beforeEach(async () => {
    profileService = {
      createProfile: jest.fn(),
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

  it('GET /api/v1/profile/overview should return 200 for valid token', async () => {
    profileService.getFullProfile.mockResolvedValue({});

    await request(app.getHttpServer())
      .get('/api/v1/profile/overview')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(profileService.getFullProfile).toHaveBeenCalledWith(userId);
  });

  it('GET /api/v1/profile/overview should return 401 when token is missing', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/profile/overview')
      .expect(401);
  });

  it('GET /api/v1/profile/overview should return 404 when not found', async () => {
    profileService.getFullProfile.mockRejectedValue(
      new NotFoundException('Profile not found for the current user.'),
    );

    await request(app.getHttpServer())
      .get('/api/v1/profile/overview')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('GET /api/v1/profile should return 200 for valid token', async () => {
    profileService.getProfile.mockResolvedValue({
      dietTypeId: 1,
      goalId: 2,
      cuisineTypeId: 3,
      targetCalories: null,
      activityLevel: null,
    });

    await request(app.getHttpServer())
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(profileService.getProfile).toHaveBeenCalledWith(userId);
  });

  it('GET /api/v1/profile should return 401 when token is missing', async () => {
    await request(app.getHttpServer()).get('/api/v1/profile').expect(401);
  });

  it('GET /api/v1/profile should return 404 when not found', async () => {
    profileService.getProfile.mockRejectedValue(
      new NotFoundException('Profile not found for the current user.'),
    );

    await request(app.getHttpServer())
      .get('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('POST /api/v1/profile should return 201 for valid payload', async () => {
    profileService.createProfile.mockResolvedValue({
      dietTypeId: 1,
      goalId: 2,
      cuisineTypeId: 3,
      targetCalories: null,
      activityLevel: null,
    });

    await request(app.getHttpServer())
      .post('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ dietTypeId: 1, goalId: 2, cuisineTypeId: 3 })
      .expect(201);

    expect(profileService.createProfile).toHaveBeenCalledWith(userId, {
      dietTypeId: 1,
      goalId: 2,
      cuisineTypeId: 3,
    });
  });

  it('POST /api/v1/profile should return 401 when token is missing', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/profile')
      .send({ dietTypeId: 1, goalId: 2, cuisineTypeId: 3 })
      .expect(401);
  });

  it('POST /api/v1/profile should return 422 for invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ activityLevel: 'INVALID' })
      .expect(422);
  });

  it('POST /api/v1/profile should return 404 when user or reference is not found', async () => {
    profileService.createProfile.mockRejectedValue(
      new NotFoundException('Goal with id 999 was not found.'),
    );

    await request(app.getHttpServer())
      .post('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ dietTypeId: 1, goalId: 999, cuisineTypeId: 3 })
      .expect(404);
  });

  it('POST /api/v1/profile should return 409 when profile already exists', async () => {
    profileService.createProfile.mockRejectedValue(
      new ConflictException('Profile already exists for the current user.'),
    );

    await request(app.getHttpServer())
      .post('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ dietTypeId: 1, goalId: 2, cuisineTypeId: 3 })
      .expect(409);
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
      .set('Authorization', `Bearer ${token}`)
      .send({ dietTypeId: 1, goalId: 2, cuisineTypeId: 3 })
      .expect(200);

    expect(profileService.updateProfile).toHaveBeenCalledWith(userId, {
      dietTypeId: 1,
      goalId: 2,
      cuisineTypeId: 3,
    });
  });

  it('PATCH /api/v1/profile should return 401 when token is missing', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/profile')
      .send({ dietTypeId: 1 })
      .expect(401);
  });

  it('PATCH /api/v1/profile should return 422 for invalid payload', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ activityLevel: 'INVALID' })
      .expect(422);
  });

  it('PATCH /api/v1/profile should return 404 when user or profile not found', async () => {
    profileService.updateProfile.mockRejectedValue(
      new NotFoundException('Profile not found for the current user.'),
    );

    await request(app.getHttpServer())
      .patch('/api/v1/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ goalId: 999 })
      .expect(404);
  });
});
