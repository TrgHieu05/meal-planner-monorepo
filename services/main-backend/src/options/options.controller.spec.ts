import { Test, TestingModule } from '@nestjs/testing';
import { OptionsController } from './options.controller';
import { OptionsService } from './options.service';

describe('OptionsController', () => {
  let controller: OptionsController;
  let optionsService: {
    getDietTypes: jest.Mock;
    getGoals: jest.Mock;
    getCuisineTypes: jest.Mock;
  };

  beforeEach(async () => {
    optionsService = {
      getDietTypes: jest.fn(),
      getGoals: jest.fn(),
      getCuisineTypes: jest.fn(),
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

  describe('getCuisineTypes', () => {
    it('should call service getCuisineTypes', async () => {
      optionsService.getCuisineTypes.mockResolvedValue([]);

      await controller.getCuisineTypes();

      expect(optionsService.getCuisineTypes).toHaveBeenCalledTimes(1);
    });
  });
});
