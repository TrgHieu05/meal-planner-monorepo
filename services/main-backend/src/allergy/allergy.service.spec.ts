import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AllergyService } from './allergy.service';

describe('AllergyService', () => {
  let service: AllergyService;
  let prisma: {
    user: { findUnique: jest.Mock };
    allergy: { findMany: jest.Mock };
    ingredient: { findMany: jest.Mock };
    favoriteIngredient: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      allergy: { findMany: jest.fn() },
      ingredient: { findMany: jest.fn() },
      favoriteIngredient: { findMany: jest.fn() },
      $transaction: jest.fn(),
    };
    service = new AllergyService(prisma as unknown as PrismaService);
  });

  describe('getAllergy', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getAllergy(userId)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.allergy.findMany).not.toHaveBeenCalled();
    });

    it('should return allergy list response for valid data', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.allergy.findMany.mockResolvedValue([
        { ingredient: { id: 1, name: 'Egg' } },
        { ingredient: { id: 2, name: 'Milk' } },
      ]);

      const result = await service.getAllergy(userId);

      expect(result).toEqual({
        list: [
          { id: 1, name: 'Egg' },
          { id: 2, name: 'Milk' },
        ],
      });
    });

    it('should throw InternalServerErrorException when response shape is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.allergy.findMany.mockResolvedValue([
        { ingredient: { id: 1, name: 123 } },
      ]);

      await expect(service.getAllergy(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateAllergy', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateAllergy(userId, { ingredientIds: [1, 2] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when ingredient is missing', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.ingredient.findMany.mockResolvedValue([{ id: 1 }]);

      await expect(
        service.updateAllergy(userId, { ingredientIds: [1, 2] }),
      ).rejects.toThrow('Ingredients not found: 2.');
      expect(prisma.favoriteIngredient.findMany).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when payload conflicts with favorite list', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.ingredient.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      prisma.favoriteIngredient.findMany.mockResolvedValue([
        { ingredient: { id: 2, name: 'Milk' } },
      ]);

      await expect(
        service.updateAllergy(userId, { ingredientIds: [1, 2] }),
      ).rejects.toMatchObject({
        response: {
          statusCode: 409,
          code: 'INGREDIENT_LIST_CONFLICT',
          conflictWith: 'favoriteIngredients',
          items: [{ id: 2, name: 'Milk' }],
        },
      });
    });

    it('should update allergies and return latest allergy list', async () => {
      const tx = {
        allergy: {
          createMany: jest.fn().mockResolvedValue({ count: 2 }),
          deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };
      prisma.$transaction.mockImplementation(
        async (
          handler: (txClient: {
            allergy: {
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
      prisma.favoriteIngredient.findMany.mockResolvedValue([]);
      prisma.allergy.findMany
        .mockResolvedValueOnce([{ ingredientId: 2 }, { ingredientId: 4 }])
        .mockResolvedValueOnce([
          { ingredient: { id: 1, name: 'Egg' } },
          { ingredient: { id: 2, name: 'Milk' } },
        ]);

      const result = await service.updateAllergy(userId, {
        ingredientIds: [1, 2, 2, 3],
      });

      expect(tx.allergy.createMany).toHaveBeenCalledWith({
        data: [
          { userId, ingredientId: 1 },
          { userId, ingredientId: 3 },
        ],
        skipDuplicates: true,
      });
      expect(tx.allergy.deleteMany).toHaveBeenCalledWith({
        where: {
          userId,
          ingredientId: { in: [4] },
        },
      });
      expect(result).toEqual({
        list: [
          { id: 1, name: 'Egg' },
          { id: 2, name: 'Milk' },
        ],
      });
    });

    it('should skip ingredient and conflict lookups when payload is empty', async () => {
      const tx = {
        allergy: {
          createMany: jest.fn().mockResolvedValue({ count: 0 }),
          deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        },
      };
      prisma.$transaction.mockImplementation(
        async (
          handler: (txClient: {
            allergy: {
              createMany: jest.Mock;
              deleteMany: jest.Mock;
            };
          }) => Promise<void>,
        ) => handler(tx),
      );
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.allergy.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      const result = await service.updateAllergy(userId, { ingredientIds: [] });

      expect(prisma.ingredient.findMany).not.toHaveBeenCalled();
      expect(prisma.favoriteIngredient.findMany).not.toHaveBeenCalled();
      expect(tx.allergy.createMany).not.toHaveBeenCalled();
      expect(tx.allergy.deleteMany).not.toHaveBeenCalled();
      expect(result).toEqual({ list: [] });
    });
  });
});
