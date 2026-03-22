import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UserService } from './../src/user/user.service';
import { PrismaService } from './../src/database/prisma.service';

describe('User API (e2e)', () => {
  let app: INestApplication<App>;
  let userService: {
    getUser: jest.Mock;
    updateUser: jest.Mock;
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(async () => {
    userService = {
      getUser: jest.fn(),
      updateUser: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UserService)
      .useValue(userService)
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

  it('GET /api/v1/users/me should return 200 for valid header', async () => {
    userService.getUser.mockResolvedValue({
      email: 'user@example.com',
      userName: 'John',
      gender: 'M',
      dateOfBirth: null,
    });

    await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('x-user-id', userId)
      .expect(200);

    expect(userService.getUser).toHaveBeenCalledWith(userId);
  });

  it('GET /api/v1/users/me should return 422 for invalid header', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('x-user-id', 'invalid-uuid')
      .expect(422);
  });

  it('GET /api/v1/users/me should return 404 when user is not found', async () => {
    userService.getUser.mockRejectedValue(
      new NotFoundException('User not found'),
    );

    await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('x-user-id', userId)
      .expect(404);
  });

  it('PATCH /api/v1/users should return 200 for valid payload', async () => {
    userService.updateUser.mockResolvedValue({
      email: 'user@example.com',
      userName: 'John Updated',
      gender: 'M',
      dateOfBirth: null,
    });

    await request(app.getHttpServer())
      .patch('/api/v1/users')
      .set('x-user-id', userId)
      .send({ userName: 'John Updated' })
      .expect(200);

    expect(userService.updateUser).toHaveBeenCalledWith(userId, {
      userName: 'John Updated',
    });
  });

  it('PATCH /api/v1/users should return 422 for invalid header', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/users')
      .set('x-user-id', 'invalid-uuid')
      .send({ userName: 'John Updated' })
      .expect(422);
  });

  it('PATCH /api/v1/users should return 422 for invalid body schema', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/users')
      .set('x-user-id', userId)
      .send({ gender: 'X' })
      .expect(422);
  });

  it('PATCH /api/v1/users should return 422 for invalid dateOfBirth format', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/users')
      .set('x-user-id', userId)
      .send({ dateOfBirth: '2000/01/01' })
      .expect(422);
  });

  it('PATCH /api/v1/users should return 422 for invalid dateOfBirth calendar date', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/users')
      .set('x-user-id', userId)
      .send({ dateOfBirth: '2000-02-30' })
      .expect(422);
  });

  it('PATCH /api/v1/users should return 404 when user is not found', async () => {
    userService.updateUser.mockRejectedValue(
      new NotFoundException('User not found'),
    );

    await request(app.getHttpServer())
      .patch('/api/v1/users')
      .set('x-user-id', userId)
      .send({ userName: 'John Updated' })
      .expect(404);
  });
});
