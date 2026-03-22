import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FavoriteIngredientService } from './favorite-ingredient.service';

describe('FavoriteIngredientService', () => {
  let service: FavoriteIngredientService;
  let prisma: {
    user: { findUnique: jest.Mock };
    favoriteIngredient: { findMany: jest.Mock };
    ingredient: { findMany: jest.Mock };
    allergy: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      favoriteIngredient: { findMany: jest.fn() },
      ingredient: { findMany: jest.fn() },
      allergy: { findMany: jest.fn() },
      $transaction: jest.fn(),
    };
    service = new FavoriteIngredientService(prisma as unknown as PrismaService);
  });

  describe('getFavoriteIngredient', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getFavoriteIngredient(userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.favoriteIngredient.findMany).not.toHaveBeenCalled();
    });

    it('should return favorite ingredient list response for valid data', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.favoriteIngredient.findMany.mockResolvedValue([
        { ingredient: { name: 'Egg' } },
        { ingredient: { name: 'Milk' } },
      ]);

      const result = await service.getFavoriteIngredient(userId);

      expect(result).toEqual({
        list: [{ name: 'Egg' }, { name: 'Milk' }],
      });
    });

    it('should throw InternalServerErrorException when response shape is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.favoriteIngredient.findMany.mockResolvedValue([
        { ingredient: { name: 123 } },
      ]);

      await expect(service.getFavoriteIngredient(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateFavoriteIngredient', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateFavoriteIngredient(userId, { ingredientIds: [1, 2] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when ingredient is missing', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.ingredient.findMany.mockResolvedValue([{ id: 1 }]);

      await expect(
        service.updateFavoriteIngredient(userId, { ingredientIds: [1, 2] }),
      ).rejects.toThrow('Ingredients not found: 2.');
      expect(prisma.allergy.findMany).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when payload conflicts with allergies', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.ingredient.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      prisma.allergy.findMany.mockResolvedValue([{ ingredientId: 2 }]);

      await expect(
        service.updateFavoriteIngredient(userId, { ingredientIds: [1, 2] }),
      ).rejects.toThrow(ConflictException);
    });

    it('should update favorites and return latest favorite list', async () => {
      const tx = {
        favoriteIngredient: {
          createMany: jest.fn().mockResolvedValue({ count: 2 }),
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };
      prisma.$transaction.mockImplementation(
        async (
          handler: (txClient: {
            favoriteIngredient: {
              createMany: jest.Mock;
              deleteMany: jest.Mock;
            };
          }) => Promise<void>,
        ) => handler(tx),
      );
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.ingredient.findMany.mockResolvedValue([
        { id: 1 },
        { id: 2 },
        { id: 3 },
      ]);
      prisma.allergy.findMany.mockResolvedValue([]);
      prisma.favoriteIngredient.findMany
        .mockResolvedValueOnce([{ ingredientId: 2 }, { ingredientId: 4 }])
        .mockResolvedValueOnce([
          { ingredient: { name: 'Egg' } },
          { ingredient: { name: 'Milk' } },
        ]);

      const result = await service.updateFavoriteIngredient(userId, {
        ingredientIds: [1, 2, 2, 3],
      });

      expect(tx.favoriteIngredient.createMany).toHaveBeenCalledWith({
        data: [
          { userId, ingredientId: 1 },
          { userId, ingredientId: 3 },
        ],
        skipDuplicates: true,
      });
      expect(tx.favoriteIngredient.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          ingredientId: { in: [4] },
        },
      });
      expect(result).toEqual({
        list: [{ name: 'Egg' }, { name: 'Milk' }],
      });
    });

    it('should skip ingredient and conflict lookups when payload is empty', async () => {
      const tx = {
        favoriteIngredient: {
          createMany: jest.fn().mockResolvedValue({ count: 0 }),
          deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
      };
      prisma.$transaction.mockImplementation(
        async (
          handler: (txClient: {
            favoriteIngredient: {
              createMany: jest.Mock;
              deleteMany: jest.Mock;
            };
          }) => Promise<void>,
        ) => handler(tx),
      );
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.favoriteIngredient.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.updateFavoriteIngredient(userId, {
        ingredientIds: [],
      });

      expect(prisma.ingredient.findMany).not.toHaveBeenCalled();
      expect(prisma.allergy.findMany).not.toHaveBeenCalled();
      expect(tx.favoriteIngredient.createMany).not.toHaveBeenCalled();
      expect(tx.favoriteIngredient.deleteMany).not.toHaveBeenCalled();
      expect(result).toEqual({ list: [] });
    });
  });
});
