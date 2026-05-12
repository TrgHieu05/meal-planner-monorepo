import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { MealSearchService } from './meal-search.service';
import { MealSearchController } from './meal-search.controller';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [PrismaModule, MediaModule],
  controllers: [MealSearchController],
  providers: [MealSearchService],
})
export class MealSearchModule {}

