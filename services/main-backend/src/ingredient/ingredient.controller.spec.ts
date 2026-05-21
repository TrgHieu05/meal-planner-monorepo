import { Test, TestingModule } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { IngredientController } from './ingredient.controller';
import { IngredientService } from './ingredient.service';

describe('IngredientController', () => {
  let controller: IngredientController;
  let ingredientService: {
    getCatalog: jest.Mock;
  };

  beforeEach(async () => {
    ingredientService = {
      getCatalog: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngredientController],
      providers: [
        {
          provide: IngredientService,
          useValue: ingredientService,
        },
      ],
    }).compile();

    controller = module.get<IngredientController>(IngredientController);
  });

  it('should parse query params and call service', async () => {
    ingredientService.getCatalog.mockResolvedValue({
      items: [],
      page: 2,
      pageSize: 30,
      total: 0,
      hasMore: false,
    });

    await controller.getCatalog({ q: 'egg', page: '2', pageSize: '30' });

    expect(ingredientService.getCatalog).toHaveBeenCalledWith({
      q: 'egg',
      page: 2,
      pageSize: 30,
    });
  });

  it('should use defaults when query is empty', async () => {
    ingredientService.getCatalog.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 30,
      total: 0,
      hasMore: false,
    });

    await controller.getCatalog({});

    expect(ingredientService.getCatalog).toHaveBeenCalledWith({
      q: '',
      page: 1,
      pageSize: 30,
    });
  });

  it('should throw when pageSize is invalid', () => {
    expect(() => controller.getCatalog({ pageSize: '10' })).toThrow(
      UnprocessableEntityException,
    );
    expect(ingredientService.getCatalog).not.toHaveBeenCalled();
  });
});