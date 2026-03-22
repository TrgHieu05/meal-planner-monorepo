import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
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
    it('should parse header and call service', async () => {
      profileService.getFullProfile.mockResolvedValue({});

      await controller.getFullProfile(userId);

      expect(profileService.getFullProfile).toHaveBeenCalledWith(userId);
    });

    it('should throw when user-id is invalid', () => {
      expect(() => controller.getFullProfile('invalid-uuid')).toThrow(
        UnprocessableEntityException,
      );
      expect(profileService.getFullProfile).not.toHaveBeenCalled();
    });
  });

  describe('getProfile', () => {
    it('should parse header and call service', async () => {
      profileService.getProfile.mockResolvedValue({});

      await controller.getProfile(userId);

      expect(profileService.getProfile).toHaveBeenCalledWith(userId);
    });

    it('should throw when user-id is invalid', async () => {
      await expect(controller.getProfile('invalid-uuid')).rejects.toThrow(
        UnprocessableEntityException,
      );
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

      await controller.updateProfile(userId, payload);

      expect(profileService.updateProfile).toHaveBeenCalledWith(
        userId,
        payload,
      );
    });

    it('should throw when header is invalid', async () => {
      await expect(
        controller.updateProfile('invalid-uuid', { dietTypeId: 1 }),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(profileService.updateProfile).not.toHaveBeenCalled();
    });

    it('should throw when body is invalid', async () => {
      await expect(
        controller.updateProfile(userId, { activityLevel: 'INVALID' }),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(profileService.updateProfile).not.toHaveBeenCalled();
    });
  });
});
