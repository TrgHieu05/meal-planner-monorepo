import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  FavoriteIngredientResponseSchema,
  FavoriteIngredientUpdate,
} from '@meal/shared/types/favorite-ingredient';
import { Uuid } from '@meal/shared/types/common';

@Injectable()
export class FavoriteIngredientService {
  constructor(private readonly prisma: PrismaService) {}

  async getFavoriteIngredient(userId: Uuid) {
    await this.assertUserExists(userId);

    const favoriteIngredientList =
      await this.prisma.favoriteIngredient.findMany({
        where: { userId },
        select: {
          ingredient: {
            select: {
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
      throw new InternalServerErrorException(
        'Invalid favorite ingredient data',
      );
    }

    return parsed.data;
  }

  async updateFavoriteIngredient(
    userId: Uuid,
    payload: FavoriteIngredientUpdate,
  ) {
    await this.assertUserExists(userId);

    const payloadIngredientIds = Array.from(new Set(payload.ingredientIds));
    await this.assertIngredientsExist(payloadIngredientIds);
    await this.assertNoAllergyConflict(userId, payloadIngredientIds);

    const existingFavoriteIngredients =
      await this.prisma.favoriteIngredient.findMany({
        where: { userId },
        select: { ingredientId: true },
      });

    const existingIngredientIdSet = new Set(
      existingFavoriteIngredients.map(
        (favoriteIngredient) => favoriteIngredient.ingredientId,
      ),
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

  private async assertUserExists(userId: Uuid) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
  }

  private async assertIngredientsExist(ingredientIds: number[]) {
    if (ingredientIds.length === 0) {
      return;
    }
    const existingIngredients = await this.prisma.ingredient.findMany({
      where: { id: { in: ingredientIds } },
      select: { id: true },
    });
    const existingIdSet = new Set(existingIngredients.map((item) => item.id));
    const missingIds = ingredientIds.filter((id) => !existingIdSet.has(id));
    if (missingIds.length > 0) {
      throw new NotFoundException(
        `Ingredients not found: ${missingIds.join(', ')}.`,
      );
    }
  }

  private async assertNoAllergyConflict(userId: Uuid, ingredientIds: number[]) {
    if (ingredientIds.length === 0) {
      return;
    }
    const conflicts = await this.prisma.allergy.findMany({
      where: {
        userId,
        ingredientId: { in: ingredientIds },
      },
      select: { ingredientId: true },
    });
    if (conflicts.length > 0) {
      const conflictIds = conflicts
        .map((item) => item.ingredientId)
        .sort((a, b) => a - b);
      throw new ConflictException(
        `Favorite ingredient update conflicts with allergies: ${conflictIds.join(', ')}.`,
      );
    }
  }
}
