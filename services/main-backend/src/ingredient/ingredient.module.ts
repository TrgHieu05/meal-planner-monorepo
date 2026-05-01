import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { IngredientController } from './ingredient.controller';
import { IngredientService } from './ingredient.service';

@Module({
  imports: [PrismaModule],
  controllers: [IngredientController],
  providers: [IngredientService],
})
export class IngredientModule {}