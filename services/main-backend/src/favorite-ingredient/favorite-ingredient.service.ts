import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  FavoriteIngredientUpdateSchema,
  FavoriteIngredientResponseSchema,
  FavoriteIngredientUpdate,
} from '@meal/shared/types/favorite-ingredient';
import { Uuid } from '@meal/shared/types/common';

@Injectable()
export class FavoriteIngredientService {
  constructor(private readonly prisma: PrismaService) {}

  async getFavoriteIngredient(userId: Uuid) {
    const favoriteIngredientList = await this.prisma.favoriteIngredient.findMany({
      where: { userId },
      select: {
        ingredient: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        ingredientId: 'asc',
      },
    });

    const response = {
      list: favoriteIngredientList.map((item) => item.ingredient),
    };

    const parsed = FavoriteIngredientResponseSchema.safeParse(response);
    if (!parsed.success) {
      throw new InternalServerErrorException('Invalid favorite ingredient data');   
    }

    return parsed.data;
  }

  async updateFavoriteIngredient(userId: Uuid, payload: FavoriteIngredientUpdate) {
    const parsed = FavoriteIngredientUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error);
    }

    const payloadIngredientIds = Array.from(new Set(parsed.data.ingredientIds));
    const existingFavoriteIngredients = await this.prisma.favoriteIngredient.findMany({
      where: { userId },
      select: { ingredientId: true },
    });

    const existingIngredientIdSet = new Set(
      existingFavoriteIngredients.map((favoriteIngredient) => favoriteIngredient.ingredientId),
    );
    const payloadIngredientIdSet = new Set(payloadIngredientIds);

    const ingredientIdsToCreate = payloadIngredientIds.filter(
      (ingredientId) => !existingIngredientIdSet.has(ingredientId),
    );
    const ingredientIdsToDelete = existingFavoriteIngredients
      .map((favoriteIngredient) => favoriteIngredient.ingredientId)
      .filter((ingredientId) => !payloadIngredientIdSet.has(ingredientId));

    await this.prisma.$transaction(async (tx) => {
      if (ingredientIdsToCreate.length > 0) {
        await tx.favoriteIngredient.createMany({
          data: ingredientIdsToCreate.map((ingredientId) => ({
            userId,
            ingredientId,
          })),
          skipDuplicates: true,
        });
      }

      if (ingredientIdsToDelete.length > 0) {
        await tx.favoriteIngredient.deleteMany({
          where: {
            userId,
            ingredientId: { in: ingredientIdsToDelete },
          },
        });
      }
    });

    return await this.getFavoriteIngredient(userId);
  }
}