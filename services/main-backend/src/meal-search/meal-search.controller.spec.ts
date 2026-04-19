import { BadRequestException } from '@nestjs/common';
import { MealSearchController } from './meal-search.controller';
import { MealSearchService } from './meal-search.service';

describe('MealSearchController', () => {
  let controller: MealSearchController;
  let service: { search: jest.Mock };

  beforeEach(() => {
    service = { search: jest.fn() };
    controller = new MealSearchController(
      service as unknown as MealSearchService,
    );
  });

  it('rejects when q is missing', async () => {
    await expect(controller.search({})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('parses and delegates to service', async () => {
    service.search.mockResolvedValue({ list: [] });
    const result = await controller.search({
      q: 'egg tomato',
      difficulty: 'easy',
      cookingTime: '<30m',
    });
    expect(service.search).toHaveBeenCalledWith({
      queryText: 'egg tomato',
      excludeIngredients: [],
      difficulty: 'easy',
      cookingTimeMaxMins: 30,
    });
    expect(result).toEqual({ list: [] });
  });
});
