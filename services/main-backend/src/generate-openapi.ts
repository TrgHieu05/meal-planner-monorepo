import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { AppModule } from './app.module';
import { PrismaService } from './database/prisma.service';
import { getSwaggerServers } from './config/runtime-config';

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
  const port = Number(process.env.PORT ?? 3000);
  app.setGlobalPrefix('api');
  await app.init();

  const swaggerBuilder = new DocumentBuilder()
    .setTitle('KitchenMind API')
    .setDescription(
      'Tài liệu hướng dẫn và kiểm thử API cho hệ thống Meal Planner\n\n' +
        '## Xác thực\n' +
        'Các endpoint được bảo vệ yêu cầu JWT Bearer token.\n' +
        'Mobile app Android gửi Google ID token vào `POST /api/auth/google/exchange` để nhận `accessToken`,\n' +
        'sau đó nhấn **Authorize** và nhập token vào ô `Bearer <token>`.',
    )
    .setVersion('1.0')
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
    ;

  for (const server of getSwaggerServers(port)) {
    swaggerBuilder.addServer(server.url, server.description);
  }

  const config = swaggerBuilder.build();

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