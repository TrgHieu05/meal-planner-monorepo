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

  // Cấu hình Swagger
  let document;
  const swaggerPath = path.resolve(__dirname, '../docs/openapi.json');

  if (fs.existsSync(swaggerPath)) {
    // Nếu có file openapi.json trong thư mục docs, nạp từ đó
    const swaggerData = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
    document = swaggerData;
  } else {
    // Ngược lại, tự động tạo từ decorators trong code
    const config = new DocumentBuilder()
      .setTitle('KitchenMind API')
      .setDescription(
        'Tài liệu hướng dẫn và kiểm thử API cho hệ thống Meal Planner',
      )
      .setVersion('1.0')
      .addTag('Meal Planner')
      .build();
    document = SwaggerModule.createDocument(app, config);
  }

  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
