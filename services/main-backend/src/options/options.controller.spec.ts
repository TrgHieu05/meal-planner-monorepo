import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { OptionsController } from './options.controller';
import { OptionsService } from './options.service';

describe('OptionsController', () => {
  let controller: OptionsController;
  let optionsService: {
    getDietTypes: jest.Mock;
    getDietTypeById: jest.Mock;
    getGoals: jest.Mock;
    getGoalById: jest.Mock;
    getCuisineTypes: jest.Mock;
    getCuisineTypeById: jest.Mock;
  };

  beforeEach(async () => {
    optionsService = {
      getDietTypes: jest.fn(),
      getDietTypeById: jest.fn(),
      getGoals: jest.fn(),
      getGoalById: jest.fn(),
      getCuisineTypes: jest.fn(),
      getCuisineTypeById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OptionsController],
      providers: [
        {
          provide: OptionsService,
          useValue: optionsService,
        },
      ],
    }).compile();

    controller = module.get<OptionsController>(OptionsController);
  });

  describe('getDietTypes', () => {
    it('should call service getDietTypes', async () => {
      optionsService.getDietTypes.mockResolvedValue([]);

      await controller.getDietTypes();

      expect(optionsService.getDietTypes).toHaveBeenCalledTimes(1);
    });
  });

  describe('getGoals', () => {
    it('should call service getGoals', async () => {
      optionsService.getGoals.mockResolvedValue([]);

      await controller.getGoals();

      expect(optionsService.getGoals).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDietTypeById', () => {
    it('should parse id and call service', async () => {
      optionsService.getDietTypeById.mockResolvedValue({
        id: 1,
        name: 'Keto',
        description: null,
      });

      await controller.getDietTypeById('1');

      expect(optionsService.getDietTypeById).toHaveBeenCalledWith(1);
    });

    it('should throw when id is invalid', () => {
      expect(() => controller.getDietTypeById('abc')).toThrow(
        UnprocessableEntityException,
      );
      expect(optionsService.getDietTypeById).not.toHaveBeenCalled();
    });
  });

  describe('getGoalById', () => {
    it('should parse id and call service', async () => {
      optionsService.getGoalById.mockResolvedValue({
        id: 1,
        name: 'Lose Weight',
        description: null,
      });

      await controller.getGoalById('1');

      expect(optionsService.getGoalById).toHaveBeenCalledWith(1);
    });

    it('should throw when id is invalid', () => {
      expect(() => controller.getGoalById('-1')).toThrow(
        UnprocessableEntityException,
      );
      expect(optionsService.getGoalById).not.toHaveBeenCalled();
    });
  });

  describe('getCuisineTypes', () => {
    it('should call service getCuisineTypes', async () => {
      optionsService.getCuisineTypes.mockResolvedValue([]);

      await controller.getCuisineTypes();

      expect(optionsService.getCuisineTypes).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCuisineTypeById', () => {
    it('should parse id and call service', async () => {
      optionsService.getCuisineTypeById.mockResolvedValue({
        id: 1,
        name: 'Vietnamese',
        description: null,
      });

      await controller.getCuisineTypeById('1');

      expect(optionsService.getCuisineTypeById).toHaveBeenCalledWith(1);
    });

    it('should throw when id is invalid', () => {
      expect(() => controller.getCuisineTypeById('0')).toThrow(
        UnprocessableEntityException,
      );
      expect(optionsService.getCuisineTypeById).not.toHaveBeenCalled();
    });
  });
});
