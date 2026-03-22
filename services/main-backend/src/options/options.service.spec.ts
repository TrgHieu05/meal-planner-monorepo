import { InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OptionsService } from './options.service';

describe('OptionsService', () => {
  let service: OptionsService;
  let prisma: {
    dietType: { findMany: jest.Mock };
    goal: { findMany: jest.Mock };
    cuisineType: { findMany: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      dietType: { findMany: jest.fn() },
      goal: { findMany: jest.fn() },
      cuisineType: { findMany: jest.fn() },
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
});
