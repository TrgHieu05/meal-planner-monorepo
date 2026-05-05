import { NotFoundException } from '@nestjs/common';
import { Difficulty } from '@meal/database';
import { MealSearchService } from './meal-search.service';
import { PrismaService } from '../database/prisma.service';

describe('MealSearchService', () => {
  let service: MealSearchService;
  let prisma: { meal: { findMany: jest.Mock; findUnique: jest.Mock; count: jest.Mock } };

  beforeEach(() => {
    prisma = { meal: { findMany: jest.fn(), findUnique: jest.fn(), count: jest.fn() } };
    service = new MealSearchService(prisma as unknown as PrismaService);
  });

  it('computes ranking score using normalize + token search', async () => {
    prisma.meal.findMany.mockResolvedValue([
      {
        id: 1,
        name: 'Omelette',
        difficulty: Difficulty.LEVEL_1,
        cookTimeMins: 25,
        ingredients: [
          { ingredient: { id: 10, name: 'egg' } },
          { ingredient: { id: 11, name: 'tomato' } },
          { ingredient: { id: 12, name: 'milk' } },
        ],
      },
    ]);

    const result = await service.search({
      queryText: 'Tomáto',
      excludeIngredients: [],
      difficulty: 'easy',
      page: 1,
      pageSize: 10,
    });

    expect(result.list).toHaveLength(1);
    const item = result.list[0];
    expect(item.name).toBe('Omelette');
    expect(item.score).toBe(2);
    expect(item.difficulty).toBe('easy');
  });

  it('sorts by score desc and limits to top 10', async () => {
    const meals = Array.from({ length: 12 }).map((_, idx) => ({
      id: idx + 1,
      name: idx === 0 ? 'Egg Deluxe' : `Meal${idx + 1}`,
      difficulty: idx % 3 === 0 ? Difficulty.LEVEL_2 : idx % 3 === 1 ? Difficulty.LEVEL_3 : Difficulty.LEVEL_5,
      cookTimeMins: 20 + idx,
      ingredients: [
        { ingredient: { id: idx + 100, name: 'egg' } },
        { ingredient: { id: idx + 200, name: `token${idx}` } },
      ],
    }));
    prisma.meal.findMany.mockResolvedValue([
      ...meals,
    ]);

    const result = await service.search({
      queryText: 'egg deluxe',
      excludeIngredients: [],
      page: 1,
      pageSize: 10,
    });

    expect(result.list).toHaveLength(10);
    expect(result.list[0]?.name).toBe('Egg Deluxe');
    expect(result.list[0]?.score).toBeGreaterThanOrEqual(
      result.list[1]?.score ?? 0,
    );
  });

  it('returns paginated list when queryText is empty', async () => {
    prisma.meal.count.mockResolvedValue(2);
    prisma.meal.findMany.mockResolvedValue([
      {
        id: 1,
        name: 'Apple Salad',
        difficulty: Difficulty.LEVEL_1,
        cookTimeMins: 5,
      },
    ]);

    const result = await service.search({
      queryText: '',
      excludeIngredients: [],
      page: 1,
      pageSize: 1,
    });

    expect(prisma.meal.count).toHaveBeenCalled();
    expect(prisma.meal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 1,
        orderBy: { name: 'asc' },
      }),
    );
    expect(result).toEqual({
      list: [
        {
          id: 1,
          name: 'Apple Salad',
          difficulty: 'easy',
          cook_time_min: 5,
          score: 0,
        },
      ],
      page: 1,
      pageSize: 1,
      total: 2,
      hasMore: true,
    });
  });

  it('throws 404 when meal does not exist', async () => {
    prisma.meal.findUnique.mockResolvedValue(null);
    await expect(service.getMealById(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('maps meal entity to detail response', async () => {
    prisma.meal.findUnique.mockResolvedValue({
      id: 1,
      name: 'Omelette',
      mealImageKey: null,
      description: 'Tasty',
      cuisineType: { id: 1, name: 'French', description: null },
      difficulty: Difficulty.LEVEL_1,
      cookTimeMins: 25,
      totalCalories: 300,
      totalProtein: 20,
      totalFat: 10,
      totalFiber: 2,
      ingredients: [{ ingredient: { id: 10, name: 'egg' }, quantity: 2 }],
    });

    const result = await service.getMealById(1);
    expect(result).toEqual({
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
  });
});
