import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { MealTemplateService } from './meal-template.service';
import { MealTemplateController } from './meal-template.controller';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [PrismaModule, MediaModule],
  controllers: [MealTemplateController],
  providers: [MealTemplateService],
})
export class MealTemplateModule {}
