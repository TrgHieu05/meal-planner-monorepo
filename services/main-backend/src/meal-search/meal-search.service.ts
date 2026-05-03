import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Difficulty, Prisma } from '@meal/database';
import { PrismaService } from '../database/prisma.service';
import { MealDetailResponse, MealSearchResultItem } from '@meal/shared';

@Injectable()
export class MealSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async getMealById(id: number): Promise<MealDetailResponse> {
    const meal = await this.prisma.meal.findUnique({
      where: { id },
      include: {
        cuisineType: true,
        ingredients: {
          include: {
            ingredient: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!meal) {
      throw new NotFoundException('Meal not found.');
    }

    const difficulty = fromDbDifficulty(meal.difficulty);
    if (!difficulty) {
      throw new InternalServerErrorException('Invalid difficulty stored for meal');
    }

    return {
      id: meal.id,
      name: meal.name,
      meal_image_key: meal.mealImageKey,
      description: meal.description,
      cuisine_type: {
        id: meal.cuisineType.id,
        name: meal.cuisineType.name,
        description: meal.cuisineType.description,
      },
      difficulty,
      cook_time_min: meal.cookTimeMins,
      total_calories: meal.totalCalories,
      total_protein: meal.totalProtein,
      total_fat: meal.totalFat,
      total_fiber: meal.totalFiber,
      ingredients: meal.ingredients.map((mi) => ({
        id: mi.ingredient.id,
        name: mi.ingredient.name,
        quantity: mi.quantity,
      })),
    };
  }

  async search(params: {
    queryText: string;
    excludeIngredients: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    cookingTimeMaxMins?: number;
  }): Promise<{ list: MealSearchResultItem[] }> {
    const normalizedQuery = normalizeText(params.queryText);
    const queryTokens = tokenize(normalizedQuery);
    const exclude = normalizeNames(params.excludeIngredients);

    const where: Prisma.MealWhereInput = {};

    if (exclude.length > 0) {
      where['NOT'] = [
        {
          ingredients: {
            some: {
              ingredient: {
                OR: exclude.map((name) => ({
                  name: {
                    contains: name,
                    mode: 'insensitive' as const,
                  },
                })),
              },
            },
          },
        },
      ];
    }

    if (params.cookingTimeMaxMins != null) {
      where['cookTimeMins'] = { lte: params.cookingTimeMaxMins };
    }

    if (params.difficulty) {
      where['difficulty'] = {
        in: toDbDifficultySet(params.difficulty),
      };
    }

    const meals = await this.prisma.meal.findMany({
      where,
      include: {
        ingredients: {
          include: {
            ingredient: { select: { id: true, name: true } },
          },
        },
      },
    });

    const results: MealSearchResultItem[] = meals
      .map((meal) => {
        const mealName = normalizeText(meal.name);
        const ingredientNames = meal.ingredients.map((mi) =>
          normalizeText(mi.ingredient.name),
        );

        const matchFullName = mealName.includes(normalizedQuery) ? 1 : 0;
        const searchTokens = new Set<string>([
          ...tokenize(mealName),
          ...ingredientNames.flatMap((n) => tokenize(n)),
        ]);
        const matchToken = queryTokens.filter((t) => searchTokens.has(t)).length;
        const score = matchFullName * 3 + matchToken * 2;

        const difficulty = fromDbDifficulty(meal.difficulty);
        if (!difficulty) {
          throw new InternalServerErrorException(
            'Invalid difficulty stored for meal',
          );
        }

        return {
          id: meal.id,
          name: meal.name,
          difficulty,
          cook_time_min: meal.cookTimeMins,
          score,
        };
      })
      .filter((item) => item.score > 0);

    results.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      const diffRank = (d: MealSearchResultItem['difficulty']) =>
        d === 'easy' ? 1 : d === 'medium' ? 2 : 3;
      if (diffRank(a.difficulty) !== diffRank(b.difficulty)) {
        return diffRank(a.difficulty) - diffRank(b.difficulty);
      }
      return a.name.localeCompare(b.name);
    });

    return { list: results.slice(0, 10) };
  }
}

function normalizeNames(list: string[]) {
  return list
    .map((s) => normalizeText(s))
    .filter((s) => s.length > 0);
}

function normalizeText(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string) {
  if (!text) return [];
  return Array.from(new Set(text.split(' ').filter(Boolean)));
}

function toDbDifficultySet(level: 'easy' | 'medium' | 'hard'): Difficulty[] {
  switch (level) {
    case 'easy':
      return [Difficulty.LEVEL_1, Difficulty.LEVEL_2];
    case 'medium':
      return [Difficulty.LEVEL_3];
    case 'hard':
      return [Difficulty.LEVEL_4, Difficulty.LEVEL_5];
  }
}

function fromDbDifficulty(
  d: Difficulty,
): MealSearchResultItem['difficulty'] | null {
  if (d === Difficulty.LEVEL_1 || d === Difficulty.LEVEL_2) return 'easy';
  if (d === Difficulty.LEVEL_3) return 'medium';
  if (d === Difficulty.LEVEL_4 || d === Difficulty.LEVEL_5) return 'hard';
  return null;
}
