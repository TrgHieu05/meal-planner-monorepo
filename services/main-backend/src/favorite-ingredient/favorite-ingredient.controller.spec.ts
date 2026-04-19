import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FavoriteIngredientController } from './favorite-ingredient.controller';
import { FavoriteIngredientService } from './favorite-ingredient.service';

describe('FavoriteIngredientController', () => {
  let controller: FavoriteIngredientController;
  let favoriteIngredientService: {
    getFavoriteIngredient: jest.Mock;
    updateFavoriteIngredient: jest.Mock;
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(async () => {
    favoriteIngredientService = {
      getFavoriteIngredient: jest.fn(),
      updateFavoriteIngredient: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoriteIngredientController],
      providers: [
        {
          provide: FavoriteIngredientService,
          useValue: favoriteIngredientService,
        },
      ],
    }).compile();

    controller = module.get<FavoriteIngredientController>(
      FavoriteIngredientController,
    );
  });

  describe('getFavoriteIngredient', () => {
    it('should parse request user and call service', async () => {
      favoriteIngredientService.getFavoriteIngredient.mockResolvedValue({
        list: [],
      });

      await controller.getFavoriteIngredient({ user: { id: userId } });

      expect(
        favoriteIngredientService.getFavoriteIngredient,
      ).toHaveBeenCalledWith(userId);
    });

    it('should throw when token user id is invalid', () => {
      expect(() =>
        controller.getFavoriteIngredient({ user: { id: 'invalid-uuid' } }),
      ).toThrow(UnauthorizedException);
      expect(
        favoriteIngredientService.getFavoriteIngredient,
      ).not.toHaveBeenCalled();
    });
  });

  describe('updateFavoriteIngredient', () => {
    it('should parse input and call service', async () => {
      const payload = { ingredientIds: [1, 2] };
      favoriteIngredientService.updateFavoriteIngredient.mockResolvedValue({
        list: [{ id: 1, name: 'Egg' }],
      });

      await controller.updateFavoriteIngredient(
        { user: { id: userId } },
        payload,
      );

      expect(
        favoriteIngredientService.updateFavoriteIngredient,
      ).toHaveBeenCalledWith(userId, payload);
    });

    it('should throw when token user id is invalid', () => {
      expect(() =>
        controller.updateFavoriteIngredient(
          { user: { id: 'invalid-uuid' } },
          { ingredientIds: [1] },
        ),
      ).toThrow(UnauthorizedException);
      expect(
        favoriteIngredientService.updateFavoriteIngredient,
      ).not.toHaveBeenCalled();
    });

    it('should throw when body is invalid', () => {
      expect(() =>
        controller.updateFavoriteIngredient(
          { user: { id: userId } },
          { ingredientIds: ['1'] },
        ),
      ).toThrow(UnprocessableEntityException);
      expect(
        favoriteIngredientService.updateFavoriteIngredient,
      ).not.toHaveBeenCalled();
    });
  });
});
