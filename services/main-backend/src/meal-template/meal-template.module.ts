import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { MealTemplateService } from './meal-template.service';
import { MealTemplateController } from './meal-template.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MealTemplateController],
  providers: [MealTemplateService],
})
export class MealTemplateModule {}
