import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AllergyController } from './allergy.controller';
import { AllergyService } from './allergy.service';

describe('AllergyController', () => {
  let controller: AllergyController;
  let allergyService: {
    getAllergy: jest.Mock;
    updateAllergy: jest.Mock;
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(async () => {
    allergyService = {
      getAllergy: jest.fn(),
      updateAllergy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AllergyController],
      providers: [
        {
          provide: AllergyService,
          useValue: allergyService,
        },
      ],
    }).compile();

    controller = module.get<AllergyController>(AllergyController);
  });

  describe('getAllergy', () => {
    it('should parse request user and call service', async () => {
      allergyService.getAllergy.mockResolvedValue({ list: [] });

      await controller.getAllergy({ user: { id: userId } });

      expect(allergyService.getAllergy).toHaveBeenCalledWith(userId);
    });

    it('should throw when token user id is invalid', () => {
      expect(() =>
        controller.getAllergy({ user: { id: 'invalid-uuid' } }),
      ).toThrow(UnauthorizedException);
      expect(allergyService.getAllergy).not.toHaveBeenCalled();
    });
  });

  describe('updateAllergy', () => {
    it('should parse input and call service', async () => {
      const payload = { ingredientIds: [1, 2] };
      allergyService.updateAllergy.mockResolvedValue({
        list: [{ id: 1, name: 'Salt' }],
      });

      await controller.updateAllergy({ user: { id: userId } }, payload);

      expect(allergyService.updateAllergy).toHaveBeenCalledWith(
        userId,
        payload,
      );
    });

    it('should throw when token user id is invalid', () => {
      expect(() =>
        controller.updateAllergy(
          { user: { id: 'invalid-uuid' } },
          {
            ingredientIds: [1],
          },
        ),
      ).toThrow(UnauthorizedException);
      expect(allergyService.updateAllergy).not.toHaveBeenCalled();
    });

    it('should throw when body is invalid', () => {
      expect(() =>
        controller.updateAllergy(
          { user: { id: userId } },
          { ingredientIds: ['1'] },
        ),
      ).toThrow(UnprocessableEntityException);
      expect(allergyService.updateAllergy).not.toHaveBeenCalled();
    });
  });
});
