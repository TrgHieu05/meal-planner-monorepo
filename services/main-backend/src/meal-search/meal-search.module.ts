import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { MealSearchService } from './meal-search.service';
import { MealSearchController } from './meal-search.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MealSearchController],
  providers: [MealSearchService],
})
export class MealSearchModule {}

