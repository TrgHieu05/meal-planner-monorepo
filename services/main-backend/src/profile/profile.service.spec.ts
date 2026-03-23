import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ProfileService } from './profile.service';

describe('ProfileService', () => {
  let service: ProfileService;
  let prisma: {
    user: { findUnique: jest.Mock };
    profile: { findUnique: jest.Mock; update: jest.Mock };
    allergy: { findMany: jest.Mock };
    favoriteIngredient: { findMany: jest.Mock };
    metric: { findFirst: jest.Mock };
    dietType: { findUnique: jest.Mock };
    goal: { findUnique: jest.Mock };
    cuisineType: { findUnique: jest.Mock };
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn() },
      profile: { findUnique: jest.fn(), update: jest.fn() },
      allergy: { findMany: jest.fn() },
      favoriteIngredient: { findMany: jest.fn() },
      metric: { findFirst: jest.fn() },
      dietType: { findUnique: jest.fn() },
      goal: { findUnique: jest.fn() },
      cuisineType: { findUnique: jest.fn() },
    };
    service = new ProfileService(prisma as unknown as PrismaService);
  });

  describe('getFullProfile', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getFullProfile(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue({
        email: 'user@example.com',
        userName: 'John',
        gender: 'M',
        dateOfBirth: null,
      });
      prisma.profile.findUnique.mockResolvedValue(null);

      await expect(service.getFullProfile(userId)).rejects.toThrow(
        'Profile not found for the current user.',
      );
    });

    it('should return full profile for valid data', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: userId })
        .mockResolvedValueOnce({
          email: 'user@example.com',
          userName: 'John',
          gender: 'M',
          dateOfBirth: null,
        });
      prisma.profile.findUnique.mockResolvedValue({
        id: userId,
        userId,
        dietTypeId: 1,
        goalId: 2,
        cuisineTypeId: 3,
        targetCalories: null,
        activityLevel: null,
      });
      prisma.allergy.findMany.mockResolvedValue([
        { ingredient: { id: 2, name: 'Milk' } },
      ]);
      prisma.favoriteIngredient.findMany.mockResolvedValue([
        { ingredient: { id: 1, name: 'Egg' } },
      ]);
      prisma.metric.findFirst.mockResolvedValue({
        id: 1,
        userId,
        heightCm: 170,
        weightKg: 65,
        bmi: 22.49,
        recordedAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      const result = await service.getFullProfile(userId);

      expect(result.basic.email).toBe('user@example.com');
      expect(result.preferences).not.toBeNull();
      if (!result.preferences) {
        throw new Error('Expected preferences to be present');
      }
      expect(result.preferences.dietTypeId).toBe(1);
      expect(result.allergies.list).toEqual([{ id: 2, name: 'Milk' }]);
      expect(result.favoriteIngredients.list).toEqual([{ id: 1, name: 'Egg' }]);
    });

    it('should throw InternalServerErrorException when user mapping is invalid', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: userId })
        .mockResolvedValueOnce({
          email: 'invalid-email',
          userName: 'John',
          gender: 'M',
          dateOfBirth: null,
        });

      await expect(service.getFullProfile(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException when profile mapping is invalid', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: userId })
        .mockResolvedValueOnce({
          email: 'user@example.com',
          userName: 'John',
          gender: 'M',
          dateOfBirth: null,
        });
      prisma.profile.findUnique.mockResolvedValue({
        id: userId,
        userId,
        dietTypeId: 0,
        goalId: 2,
        cuisineTypeId: 3,
      });

      await expect(service.getFullProfile(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException when allergies mapping is invalid', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: userId })
        .mockResolvedValueOnce({
          email: 'user@example.com',
          userName: 'John',
          gender: 'M',
          dateOfBirth: null,
        });
      prisma.profile.findUnique.mockResolvedValue({
        id: userId,
        userId,
        dietTypeId: 1,
        goalId: 2,
        cuisineTypeId: 3,
        targetCalories: null,
        activityLevel: null,
      });
      prisma.allergy.findMany.mockResolvedValue([
        { ingredient: { id: 1, name: 123 } },
      ]);

      await expect(service.getFullProfile(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException when favorite ingredients mapping is invalid', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: userId })
        .mockResolvedValueOnce({
          email: 'user@example.com',
          userName: 'John',
          gender: 'M',
          dateOfBirth: null,
        });
      prisma.profile.findUnique.mockResolvedValue({
        id: userId,
        userId,
        dietTypeId: 1,
        goalId: 2,
        cuisineTypeId: 3,
        targetCalories: null,
        activityLevel: null,
      });
      prisma.allergy.findMany.mockResolvedValue([]);
      prisma.favoriteIngredient.findMany.mockResolvedValue([
        { ingredient: { id: 1, name: 123 } },
      ]);

      await expect(service.getFullProfile(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException when latest metric mapping is invalid', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce({ id: userId })
        .mockResolvedValueOnce({
          email: 'user@example.com',
          userName: 'John',
          gender: 'M',
          dateOfBirth: null,
        });
      prisma.profile.findUnique.mockResolvedValue({
        id: userId,
        userId,
        dietTypeId: 1,
        goalId: 2,
        cuisineTypeId: 3,
        targetCalories: null,
        activityLevel: null,
      });
      prisma.allergy.findMany.mockResolvedValue([]);
      prisma.favoriteIngredient.findMany.mockResolvedValue([]);
      prisma.metric.findFirst.mockResolvedValue({
        id: 1,
        userId,
        heightCm: 170,
        weightKg: 65,
        bmi: 22.49,
        recordedAt: 'invalid-date',
      });

      await expect(service.getFullProfile(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getProfile', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile(userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.profile.findUnique.mockResolvedValue(null);

      await expect(service.getProfile(userId)).rejects.toThrow(
        'Profile not found for the current user.',
      );
    });

    it('should return profile for valid data', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.profile.findUnique.mockResolvedValue({
        id: userId,
        userId,
        dietTypeId: 1,
        goalId: 2,
        cuisineTypeId: 3,
        targetCalories: null,
        activityLevel: null,
      });

      const result = await service.getProfile(userId);

      expect(result).toEqual({
        dietTypeId: 1,
        goalId: 2,
        cuisineTypeId: 3,
        targetCalories: null,
        activityLevel: null,
      });
    });

    it('should throw InternalServerErrorException when profile mapping is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.profile.findUnique.mockResolvedValue({
        id: userId,
        userId,
        dietTypeId: 0,
        goalId: 2,
        cuisineTypeId: 3,
      });

      await expect(service.getProfile(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateProfile', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile(userId, { dietTypeId: 1 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when profile does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.profile.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile(userId, { dietTypeId: 1 }),
      ).rejects.toThrow('Profile not found for the current user.');
    });

    it('should throw NotFoundException when diet type reference does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.profile.findUnique.mockResolvedValue({ userId });
      prisma.dietType.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile(userId, { dietTypeId: 999 }),
      ).rejects.toThrow('Diet type with id 999 was not found.');
    });

    it('should throw NotFoundException when goal reference does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.profile.findUnique.mockResolvedValue({ userId });
      prisma.goal.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile(userId, { goalId: 999 }),
      ).rejects.toThrow('Goal with id 999 was not found.');
    });

    it('should throw NotFoundException when cuisine type reference does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.profile.findUnique.mockResolvedValue({ userId });
      prisma.cuisineType.findUnique.mockResolvedValue(null);

      await expect(
        service.updateProfile(userId, { cuisineTypeId: 999 }),
      ).rejects.toThrow('Cuisine type with id 999 was not found.');
    });

    it('should update and return profile for valid payload', async () => {
      const payload = {
        dietTypeId: 1,
        goalId: 2,
        cuisineTypeId: 3,
      };
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.profile.findUnique.mockResolvedValue({ userId });
      prisma.dietType.findUnique.mockResolvedValue({ id: 1 });
      prisma.goal.findUnique.mockResolvedValue({ id: 2 });
      prisma.cuisineType.findUnique.mockResolvedValue({ id: 3 });
      prisma.profile.update.mockResolvedValue({
        id: userId,
        userId,
        ...payload,
        targetCalories: null,
        activityLevel: null,
      });

      const result = await service.updateProfile(userId, payload);

      expect(prisma.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: payload,
      });
      expect(result).toEqual({
        ...payload,
        targetCalories: null,
        activityLevel: null,
      });
    });

    it('should throw InternalServerErrorException when updated profile mapping is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: userId });
      prisma.profile.findUnique.mockResolvedValue({ userId });
      prisma.profile.update.mockResolvedValue({
        id: userId,
        userId,
        dietTypeId: 0,
        goalId: 2,
        cuisineTypeId: 3,
      });

      await expect(
        service.updateProfile(userId, { targetCalories: 2000 }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
