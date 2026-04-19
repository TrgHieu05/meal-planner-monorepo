import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

describe('ProfileController', () => {
  let controller: ProfileController;
  let profileService: {
    getFullProfile: jest.Mock;
    getProfile: jest.Mock;
    updateProfile: jest.Mock;
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(async () => {
    profileService = {
      getFullProfile: jest.fn(),
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: profileService,
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
  });

  describe('getFullProfile', () => {
    it('should parse request user and call service', async () => {
      profileService.getFullProfile.mockResolvedValue({});

      await controller.getFullProfile({ user: { id: userId } });

      expect(profileService.getFullProfile).toHaveBeenCalledWith(userId);
    });

    it('should throw when token user id is invalid', () => {
      expect(() =>
        controller.getFullProfile({ user: { id: 'invalid-uuid' } }),
      ).toThrow(UnauthorizedException);
      expect(profileService.getFullProfile).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should parse request user and call service', async () => {
      profileService.getProfile.mockResolvedValue({});

      await controller.getProfile({ user: { id: userId } });

      expect(profileService.getProfile).toHaveBeenCalledWith(userId);
    });

    it('should throw when token user id is invalid', async () => {
      await expect(
        controller.getProfile({ user: { id: 'invalid-uuid' } }),
      ).rejects.toThrow(UnauthorizedException);
      expect(profileService.getProfile).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should parse payload and call service', async () => {
      const payload = {
        dietTypeId: 1,
        goalId: 2,
      };
      profileService.updateProfile.mockResolvedValue(payload);

      await controller.updateProfile({ user: { id: userId } }, payload);

      expect(profileService.updateProfile).toHaveBeenCalledWith(
        userId,
        payload,
      );
    });

    it('should throw when token user id is invalid', async () => {
      await expect(
        controller.updateProfile(
          { user: { id: 'invalid-uuid' } },
          { dietTypeId: 1 },
        ),
      ).rejects.toThrow(UnauthorizedException);
      expect(profileService.updateProfile).not.toHaveBeenCalled();
    });

    it('should throw when body is invalid', async () => {
      await expect(
        controller.updateProfile(
          { user: { id: userId } },
          { activityLevel: 'INVALID' },
        ),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(profileService.updateProfile).not.toHaveBeenCalled();
    });
  });
});
