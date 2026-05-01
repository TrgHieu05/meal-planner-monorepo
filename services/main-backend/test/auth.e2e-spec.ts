import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AuthController } from '../src/auth/auth.controller';
import { AuthModule } from '../src/auth/auth.module';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/database/prisma.service';

describe('Auth API (e2e)', () => {
  let app: INestApplication<App>;
  let authService: {
    exchangeGoogleIdToken: jest.Mock;
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  let token: string;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '7d';
    process.env.GOOGLE_WEB_CLIENT_ID = 'web-client-id';

    authService = {
      exchangeGoogleIdToken: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
        }),
        AuthModule,
      ],
    })
      .overrideProvider(AuthService)
      .useValue(authService)
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

  it('POST /api/auth/google/exchange should return 200 for valid payload', async () => {
    authService.exchangeGoogleIdToken.mockResolvedValue({
      message: 'Xác thực Google thành công',
      user: {
        id: userId,
        email: 'user@example.com',
        userName: 'John',
      },
      accessToken: 'jwt-token-here',
    });

    await request(app.getHttpServer())
      .post('/api/auth/google/exchange')
      .send({ idToken: 'google-id-token' })
      .expect(200);

    expect(authService.exchangeGoogleIdToken).toHaveBeenCalledWith(
      'google-id-token',
    );
  });

  it('POST /api/auth/google/exchange should return 422 for invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/google/exchange')
      .send({})
      .expect(422);
  });

  it('GET /api/auth/profile should return 200 for valid token', async () => {
    await request(app.getHttpServer())
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect({
        id: userId,
        email: 'user@example.com',
        userName: 'John',
      });
  });

  it('GET /api/auth/profile should return 401 when token is missing', async () => {
    await request(app.getHttpServer()).get('/api/auth/profile').expect(401);
  });
});