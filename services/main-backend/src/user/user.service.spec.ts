import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new UserService(prisma as unknown as PrismaService);
  });

  describe('getUser', () => {
    it('should throw NotFoundException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUser(userId)).rejects.toThrow(NotFoundException);
    });

    it('should return user response for valid data', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
        userName: 'John',
        gender: 'M',
        dateOfBirth: new Date('2000-01-01T00:00:00.000Z'),
      });

      const result = await service.getUser(userId);

      expect(result).toEqual({
        email: 'user@example.com',
        userName: 'John',
        gender: 'M',
        dateOfBirth: new Date('2000-01-01T00:00:00.000Z'),
      });
    });

    it('should throw InternalServerErrorException when user shape is invalid', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'invalid-email',
        userName: 'John',
        gender: 'M',
        dateOfBirth: null,
      });

      await expect(service.getUser(userId)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('updateUser', () => {
    it('should call prisma update with correct payload', async () => {
      const payload = { userName: 'John Updated' };
      prisma.user.update.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
        userName: 'John Updated',
        gender: 'M',
        dateOfBirth: null,
      });

      await service.updateUser(userId, payload);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: payload,
      });
    });

    it('should throw InternalServerErrorException when prisma update returns null', async () => {
      prisma.user.update.mockResolvedValue(null);

      await expect(
        service.updateUser(userId, { userName: 'John Updated' }),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should return updated user response for valid data', async () => {
      prisma.user.update.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
        userName: 'John Updated',
        gender: 'M',
        dateOfBirth: null,
      });

      const result = await service.updateUser(userId, {
        userName: 'John Updated',
      });

      expect(result).toEqual({
        email: 'user@example.com',
        userName: 'John Updated',
        gender: 'M',
        dateOfBirth: null,
      });
    });

    it('should throw InternalServerErrorException when updated user shape is invalid', async () => {
      prisma.user.update.mockResolvedValue({
        id: userId,
        email: 'user@example.com',
        userName: 'John Updated',
        gender: 'X',
        dateOfBirth: null,
      });

      await expect(
        service.updateUser(userId, { userName: 'John Updated' }),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
