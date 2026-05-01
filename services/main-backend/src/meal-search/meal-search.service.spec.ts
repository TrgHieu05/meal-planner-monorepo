import { Difficulty } from '@meal/database';
import { MealSearchService } from './meal-search.service';
import { PrismaService } from '../database/prisma.service';

describe('MealSearchService', () => {
  let service: MealSearchService;
  let prisma: { meal: { findMany: jest.Mock } };

  beforeEach(() => {
    prisma = { meal: { findMany: jest.fn() } };
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
    });

    expect(result.list).toHaveLength(10);
    expect(result.list[0]?.name).toBe('Egg Deluxe');
    expect(result.list[0]?.score).toBeGreaterThanOrEqual(
      result.list[1]?.score ?? 0,
    );
  });
});
