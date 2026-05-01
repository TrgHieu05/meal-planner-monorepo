import { INestApplication, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UserService } from './../src/user/user.service';
import { PrismaService } from './../src/database/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('User API (e2e)', () => {
  let app: INestApplication<App>;
  let userService: {
    getUser: jest.Mock;
    updateUser: jest.Mock;
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  let token: string;

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

  it('GET /api/v1/users/me should return 200 for valid token', async () => {
    userService.getUser.mockResolvedValue({
      email: 'user@example.com',
      userName: 'John',
      gender: 'M',
      dateOfBirth: null,
    });

    await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(userService.getUser).toHaveBeenCalledWith(userId);
  });

  it('GET /api/v1/users/me should return 401 when token is missing', async () => {
    await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
  });

  it('GET /api/v1/users/me should return 404 when user is not found', async () => {
    userService.getUser.mockRejectedValue(
      new NotFoundException('User not found'),
    );

    await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${token}`)
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
      .set('Authorization', `Bearer ${token}`)
      .send({ userName: '  John Updated  ' })
      .expect(200);

    expect(userService.updateUser).toHaveBeenCalledWith(userId, {
      userName: 'John Updated',
    });
  });

  it('PATCH /api/v1/users should return 401 when token is missing', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/users')
      .send({ userName: 'John Updated' })
      .expect(401);
  });

  it('PATCH /api/v1/users should return 422 for invalid body schema', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ gender: 'X' })
      .expect(422);
  });

  it('PATCH /api/v1/users should return 422 for blank userName', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ userName: '   ' })
      .expect(422);

    expect(userService.updateUser).not.toHaveBeenCalled();
  });

  it('PATCH /api/v1/users should return 422 for invalid dateOfBirth format', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ dateOfBirth: '2000/01/01' })
      .expect(422);
  });

  it('PATCH /api/v1/users should return 422 for invalid dateOfBirth calendar date', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ dateOfBirth: '2000-02-30' })
      .expect(422);
  });

  it('PATCH /api/v1/users should return 404 when user is not found', async () => {
    userService.updateUser.mockRejectedValue(
      new NotFoundException('User not found'),
    );

    await request(app.getHttpServer())
      .patch('/api/v1/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ userName: 'John Updated' })
      .expect(404);
  });
});
