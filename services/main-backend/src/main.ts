import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Nạp file .env từ thư mục gốc Monorepo ngay lập tức
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Thiết lập prefix chung cho API
  app.setGlobalPrefix('api');

  // ── Swagger / OpenAPI ────────────────────────────────────────────────────
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
    .addServer('http://localhost:3000', 'Local Development')
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
      persistAuthorization: true,       // Giữ token sau khi refresh trang
      tryItOutEnabled: true,            // Bật sẵn "Try it out"
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
