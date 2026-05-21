import * as path from 'node:path';
import * as fs from 'node:fs';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { getAllowedCorsOrigins, getSwaggerServers } from './config/runtime-config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3000);

  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = getAllowedCorsOrigins();

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Thiết lập prefix chung cho API
  app.setGlobalPrefix('api');

  // ── Swagger / OpenAPI ────────────────────────────────────────────────────
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

  // Ghi lại openapi.json để giữ file static luôn đồng bộ
  const docsDir = path.resolve(__dirname, '../docs');
  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(
    path.join(docsDir, 'openapi.json'),
    JSON.stringify(document, null, 2),
    'utf8',
  );

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Giữ token sau khi refresh trang
      tryItOutEnabled: true, // Bật sẵn "Try it out"
    },
  });

  await app.listen(port);
}
bootstrap();
