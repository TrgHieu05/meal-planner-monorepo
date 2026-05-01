import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OptionsService } from './options.service';

describe('OptionsService', () => {
  let service: OptionsService;
  let prisma: {
    dietType: { findMany: jest.Mock; findUnique: jest.Mock };
    goal: { findMany: jest.Mock; findUnique: jest.Mock };
    cuisineType: { findMany: jest.Mock; findUnique: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      dietType: { findMany: jest.fn(), findUnique: jest.fn() },
      goal: { findMany: jest.fn(), findUnique: jest.fn() },
      cuisineType: { findMany: jest.fn(), findUnique: jest.fn() },
    };
    service = new OptionsService(prisma as unknown as PrismaService);
  });

  describe('getDietTypes', () => {
    it('should return diet types for valid data', async () => {
      prisma.dietType.findMany.mockResolvedValue([
        { id: 1, name: 'Keto', description: null },
      ]);

      const result = await service.getDietTypes();

      expect(prisma.dietType.findMany).toHaveBeenCalledWith({
        orderBy: { id: 'asc' },
        select: { id: true, name: true, description: true },
      });
      expect(result).toEqual([{ id: 1, name: 'Keto', description: null }]);
    });

    it('should throw InternalServerErrorException for invalid diet types data', async () => {
      prisma.dietType.findMany.mockResolvedValue([
        { id: 0, name: 'Keto', description: null },
      ]);

      await expect(service.getDietTypes()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getGoals', () => {
    it('should return goals for valid data', async () => {
      prisma.goal.findMany.mockResolvedValue([
        { id: 1, name: 'Lose Weight', description: null },
      ]);

      const result = await service.getGoals();

      expect(prisma.goal.findMany).toHaveBeenCalledWith({
        orderBy: { id: 'asc' },
        select: { id: true, name: true, description: true },
      });
      expect(result).toEqual([
        { id: 1, name: 'Lose Weight', description: null },
      ]);
    });

    it('should throw InternalServerErrorException for invalid goals data', async () => {
      prisma.goal.findMany.mockResolvedValue([
        { id: 1, name: 123, description: null },
      ]);

      await expect(service.getGoals()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getCuisineTypes', () => {
    it('should return cuisine types for valid data', async () => {
      prisma.cuisineType.findMany.mockResolvedValue([
        { id: 1, name: 'Asian', description: null },
      ]);

      const result = await service.getCuisineTypes();

      expect(prisma.cuisineType.findMany).toHaveBeenCalledWith({
        orderBy: { id: 'asc' },
        select: { id: true, name: true, description: true },
      });
      expect(result).toEqual([{ id: 1, name: 'Asian', description: null }]);
    });

    it('should throw InternalServerErrorException for invalid cuisine types data', async () => {
      prisma.cuisineType.findMany.mockResolvedValue([
        { id: 1, name: 'Asian', description: 123 },
      ]);

      await expect(service.getCuisineTypes()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getDietTypeById', () => {
    it('should return diet type for valid data', async () => {
      prisma.dietType.findUnique.mockResolvedValue({
        id: 1,
        name: 'Keto',
        description: null,
      });

      const result = await service.getDietTypeById(1);

      expect(prisma.dietType.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, name: true, description: true },
      });
      expect(result).toEqual({ id: 1, name: 'Keto', description: null });
    });

    it('should throw NotFoundException when diet type does not exist', async () => {
      prisma.dietType.findUnique.mockResolvedValue(null);

      await expect(service.getDietTypeById(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getGoalById', () => {
    it('should return goal for valid data', async () => {
      prisma.goal.findUnique.mockResolvedValue({
        id: 1,
        name: 'Lose Weight',
        description: null,
      });

      const result = await service.getGoalById(1);

      expect(prisma.goal.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, name: true, description: true },
      });
      expect(result).toEqual({ id: 1, name: 'Lose Weight', description: null });
    });

    it('should throw NotFoundException when goal does not exist', async () => {
      prisma.goal.findUnique.mockResolvedValue(null);

      await expect(service.getGoalById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCuisineTypeById', () => {
    it('should return cuisine type for valid data', async () => {
      prisma.cuisineType.findUnique.mockResolvedValue({
        id: 1,
        name: 'Asian',
        description: null,
      });

      const result = await service.getCuisineTypeById(1);

      expect(prisma.cuisineType.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, name: true, description: true },
      });
      expect(result).toEqual({ id: 1, name: 'Asian', description: null });
    });

    it('should throw NotFoundException when cuisine type does not exist', async () => {
      prisma.cuisineType.findUnique.mockResolvedValue(null);

      await expect(service.getCuisineTypeById(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
