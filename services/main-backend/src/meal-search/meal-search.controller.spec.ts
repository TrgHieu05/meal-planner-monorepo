import { BadRequestException } from '@nestjs/common';
import { MealSearchController } from './meal-search.controller';
import { MealSearchService } from './meal-search.service';

describe('MealSearchController', () => {
  let controller: MealSearchController;
  let service: { search: jest.Mock; getMealById: jest.Mock };

  beforeEach(() => {
    service = { search: jest.fn(), getMealById: jest.fn() };
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

  it('rejects getMealById when id is invalid', async () => {
    await expect(controller.getMealById('0')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    await expect(controller.getMealById('abc')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('delegates getMealById to service', async () => {
    service.getMealById.mockResolvedValue({
      id: 1,
      name: 'Omelette',
      meal_image_key: null,
      description: 'Tasty',
      cuisine_type: { id: 1, name: 'French', description: null },
      difficulty: 'easy',
      cook_time_min: 25,
      total_calories: 300,
      total_protein: 20,
      total_fat: 10,
      total_fiber: 2,
      ingredients: [{ id: 10, name: 'egg', quantity: 2 }],
    });

    const result = await controller.getMealById('1');
    expect(service.getMealById).toHaveBeenCalledWith(1);
    expect(result.id).toBe(1);
  });
});
