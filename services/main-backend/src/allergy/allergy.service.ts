import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  AllergyUpdateSchema,
  AllergyResponseSchema,
  AllergyUpdate,
} from '@meal/shared/types/allergy';
import { Uuid } from '@meal/shared/types/common';

@Injectable()
export class AllergyService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllergy(userId: Uuid) {
    const allergy = await this.prisma.allergy.findMany({
      where: { userId },
    });

    if (!allergy) {
      return null;
    }

    const parsed = AllergyResponseSchema.safeParse(allergy);
    if (!parsed.success) {
      throw new InternalServerErrorException('Invalid allergy data');
    }

    return parsed.data;
  }

  async updateAllergy(userId: Uuid, payload: AllergyUpdate) {
    const parsed = AllergyUpdateSchema.safeParse(payload);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error);
    }

    const payloadIngredientIds = Array.from(new Set(parsed.data.ingredientIds));
    const existingAllergies = await this.prisma.allergy.findMany({
      where: { userId },
      select: { ingredientId: true },
    });

    const existingIngredientIdSet = new Set(
      existingAllergies.map((allergy) => allergy.ingredientId),
    );
    const payloadIngredientIdSet = new Set(payloadIngredientIds);

    const ingredientIdsToCreate = payloadIngredientIds.filter(
      (ingredientId) => !existingIngredientIdSet.has(ingredientId),
    );
    const ingredientIdsToDelete = existingAllergies
      .map((allergy) => allergy.ingredientId)
      .filter((ingredientId) => !payloadIngredientIdSet.has(ingredientId));

    await this.prisma.$transaction(async (tx) => {
      if (ingredientIdsToCreate.length > 0) {
        await tx.allergy.createMany({
          data: ingredientIdsToCreate.map((ingredientId) => ({
            userId,
            ingredientId,
          })),
          skipDuplicates: true,
        });
      }

      if (ingredientIdsToDelete.length > 0) {
        await tx.allergy.deleteMany({
          where: {
            userId,
            ingredientId: { in: ingredientIdsToDelete },
          },
        });
      }
    });
  }
}
