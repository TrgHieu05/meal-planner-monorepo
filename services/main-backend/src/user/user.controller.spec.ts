import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: {
    getUser: jest.Mock;
    updateUser: jest.Mock;
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(async () => {
    userService = {
      getUser: jest.fn(),
      updateUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: userService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  describe('getCurrentUser', () => {
    it('should parse request user and call service', async () => {
      userService.getUser.mockResolvedValue({
        email: 'user@example.com',
        userName: 'John',
        gender: 'M',
        dateOfBirth: null,
      });

      await controller.getCurrentUser({ user: { id: userId } });

      expect(userService.getUser).toHaveBeenCalledWith(userId);
    });

    it('should throw when token user id is invalid', async () => {
      await expect(
        controller.getCurrentUser({ user: { id: 'invalid-uuid' } }),
      ).rejects.toThrow(UnauthorizedException);
      expect(userService.getUser).not.toHaveBeenCalled();
    });
  });

  describe('updateCurrentUser', () => {
    it('should parse payload and call service', async () => {
      const payload = {
        userName: 'John Doe',
        gender: 'M',
      };
      userService.updateUser.mockResolvedValue({
        email: 'user@example.com',
        userName: 'John Doe',
        gender: 'M',
        dateOfBirth: null,
      });

      await controller.updateCurrentUser({ user: { id: userId } }, payload);

      expect(userService.updateUser).toHaveBeenCalledWith(userId, payload);
    });

    it('should normalize dateOfBirth string to Date', async () => {
      userService.updateUser.mockResolvedValue({
        email: 'user@example.com',
        userName: 'John Doe',
        gender: 'M',
        dateOfBirth: new Date('2000-01-01T00:00:00.000Z'),
      });

      await controller.updateCurrentUser(
        { user: { id: userId } },
        { dateOfBirth: '2000-01-01' },
      );

      expect(userService.updateUser).toHaveBeenCalledWith(userId, {
        dateOfBirth: new Date('2000-01-01T00:00:00.000Z'),
      });
    });

    it('should throw when token user id is invalid', async () => {
      await expect(
        controller.updateCurrentUser(
          { user: { id: 'invalid-uuid' } },
          { userName: 'John Doe' },
        ),
      ).rejects.toThrow(UnauthorizedException);
      expect(userService.updateUser).not.toHaveBeenCalled();
    });

    it('should throw when body schema is invalid', async () => {
      await expect(
        controller.updateCurrentUser({ user: { id: userId } }, { gender: 'X' }),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(userService.updateUser).not.toHaveBeenCalled();
    });

    it('should throw when dateOfBirth format is invalid', async () => {
      await expect(
        controller.updateCurrentUser(
          { user: { id: userId } },
          { dateOfBirth: '2000/01/01' },
        ),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(userService.updateUser).not.toHaveBeenCalled();
    });

    it('should throw when dateOfBirth is invalid calendar date', async () => {
      await expect(
        controller.updateCurrentUser(
          { user: { id: userId } },
          { dateOfBirth: '2000-02-30' },
        ),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(userService.updateUser).not.toHaveBeenCalled();
    });
  });
});
