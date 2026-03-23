import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { FavoriteIngredientController } from './favorite-ingredient.controller';
import { FavoriteIngredientService } from './favorite-ingredient.service';

@Module({
  imports: [PrismaModule],
  controllers: [FavoriteIngredientController],
  providers: [FavoriteIngredientService],
})
export class FavoriteIngredientModule {}
