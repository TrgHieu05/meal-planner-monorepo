import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { AppModule } from './app.module';
import { PrismaService } from './database/prisma.service';

async function generate() {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue({
      user: { findUnique: async () => null },
      $connect: async () => undefined,
      $disconnect: async () => undefined,
    })
    .compile();

  const app: INestApplication = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  await app.init();

  const config = new DocumentBuilder()
    .setTitle('KitchenMind API')
    .setDescription(
      'Tài liệu hướng dẫn và kiểm thử API cho hệ thống Meal Planner\n\n' +
        '## Xác thực\n' +
        'Các endpoint được bảo vệ yêu cầu JWT Bearer token.\n' +
        'Đăng nhập qua Google (`GET /api/auth/google`) để nhận `accessToken`,\n' +
        'sau đó nhấn **Authorize** và nhập token vào ô `Bearer <token>`.',
    )
    .setVersion('1.0')
    .addServer('http://localhost:8080', 'Nginx Gateway Local')
    .addServer('http://localhost:3000', 'Direct Main-Backend Port')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Nhập JWT token (không cần tiền tố Bearer)',
        in: 'header',
      },
      'JWT',
    )
    .addTag('Authentication', 'Các API liên quan đến xác thực người dùng')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  const docsDir = path.resolve(__dirname, '../docs');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(
    path.join(docsDir, 'openapi.json'),
    JSON.stringify(document, null, 2),
    'utf8',
  );

  await app.close();
}

generate();