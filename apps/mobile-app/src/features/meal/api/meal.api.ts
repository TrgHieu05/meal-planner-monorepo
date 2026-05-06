import { z } from 'zod';

import { IntSchema } from '@meal/shared/types/common';
import {
  MealDetailResponseSchema,
  type MealDetailResponse,
} from '@meal/shared/types/meal';
import {
  MealSearchQuerySchema,
  MealSearchResponseSchema,
  type MealSearchQuery,
  type MealSearchResponse,
  type MealSearchResultItem,
} from '@meal/shared/types/meal-search';

import { createAuthenticatedApiClient } from '@/services/api/http-client';

import type {
  MealDetailIngredientViewModel,
  MealDetailViewModel,
  MealDifficultyLabel,
  MealSearchCardViewModel,
  MealSearchScreenData,
} from '../types';

export type PublicMealApiConfig = {
  apiBaseUrl?: string;
};

export type AuthenticatedMealApiConfig = PublicMealApiConfig & {
  accessToken: string;
};

const MealSearchRequestSchema = MealSearchQuerySchema;
const MealIdRequestSchema = IntSchema;

export async function fetchMealSearchResults(config: AuthenticatedMealApiConfig & {
  query?: Partial<MealSearchQuery>;
}): Promise<MealSearchResponse> {
  const client = createProtectedMealApiClient(config);
  const query = parseWithSchema(
    MealSearchRequestSchema,
    config.query ?? {},
    {
      userMessage: 'Unable to load meals right now.',
      failureMode: 'request',
    },
  );

  const response = await client.get('/v1/meals', {
    params: serializeMealSearchQuery(query),
  });

  return parseWithSchema(
    MealSearchResponseSchema,
    response.data,
    { userMessage: 'Unable to load meals right now.' },
  );
}

export async function fetchMealSearchScreenData(config: AuthenticatedMealApiConfig & {
  query?: Partial<MealSearchQuery>;
}): Promise<MealSearchScreenData> {
  const response = await fetchMealSearchResults(config);
  return mapMealSearchResponseToScreenData(response);
}

export async function fetchMealDetail(config: AuthenticatedMealApiConfig & {
  mealId: number;
}): Promise<MealDetailResponse> {
  const client = createProtectedMealApiClient(config);
  const mealId = parseWithSchema(
    MealIdRequestSchema,
    config.mealId,
    {
      userMessage: 'Unable to load meal details right now.',
      failureMode: 'request',
    },
  );

  const response = await client.get(`/v1/meals/${mealId}`);

  return parseWithSchema(
    MealDetailResponseSchema,
    response.data,
    { userMessage: 'Unable to load meal details right now.' },
  );
}

export async function fetchMealDetailViewModel(config: AuthenticatedMealApiConfig & {
  mealId: number;
}): Promise<MealDetailViewModel> {
  const response = await fetchMealDetail(config);
  return mapMealDetailResponseToViewModel(response);
}

export function mapMealSearchResponseToScreenData(
  response: MealSearchResponse,
): MealSearchScreenData {
  return {
    list: response.list.map(mapMealSearchResultToCardViewModel),
    page: response.page,
    pageSize: response.pageSize,
    total: response.total,
    hasMore: response.hasMore,
  };
}

export function mapMealSearchResultToCardViewModel(
  meal: MealSearchResultItem,
): MealSearchCardViewModel {
  return {
    mealId: meal.id,
    mealName: meal.name,
    mealImageKey: meal.meal_image_key,
    cookTime: formatCookTimeLabel(meal.cook_time_min),
    difficulty: formatMealDifficultyLabel(meal.difficulty),
    totalCalories: formatNumericLabel(meal.total_calories),
    totalProtein: formatNumericLabel(meal.total_protein),
    totalFiber: formatNumericLabel(meal.total_fiber),
    totalFat: formatNumericLabel(meal.total_fat),
    score: meal.score,
  };
}

export function mapMealDetailResponseToViewModel(
  meal: MealDetailResponse,
): MealDetailViewModel {
  return {
    mealId: meal.id,
    mealName: meal.name,
    mealImageKey: meal.meal_image_key,
    description: meal.description,
    cuisineTypeName: meal.cuisine_type.name,
    difficulty: formatMealDifficultyLabel(meal.difficulty),
    cookTime: formatCookTimeLabel(meal.cook_time_min),
    totalCalories: formatNumericLabel(meal.total_calories),
    totalProtein: formatNumericLabel(meal.total_protein),
    totalFiber: formatNumericLabel(meal.total_fiber),
    totalFat: formatNumericLabel(meal.total_fat),
    ingredients: meal.ingredients.map(mapMealIngredientToViewModel),
  };
}

export function mapMealIngredientToViewModel(
  ingredient: MealDetailResponse['ingredients'][number],
): MealDetailIngredientViewModel {
  return {
    id: ingredient.id,
    name: ingredient.name,
    quantity: ingredient.quantity,
    quantityLabel: formatNumericLabel(ingredient.quantity),
  };
}

export function formatCookTimeLabel(minutes: number) {
  if (minutes < 60) {
    return `${minutes} mins`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }

  const hourLabel = hours === 1 ? '1 hour' : `${hours} hours`;
  return `${hourLabel} ${remainingMinutes} mins`;
}

function formatMealDifficultyLabel(
  difficulty: MealSearchResultItem['difficulty'],
): MealDifficultyLabel {
  switch (difficulty) {
    case 'easy':
      return 'Easy';
    case 'medium':
      return 'Medium';
    case 'hard':
      return 'Hard';
  }
}

function formatNumericLabel(value: number) {
  return Number.isInteger(value)
    ? `${value}`
    : `${Number(value.toFixed(2)).toString()}`;
}

function serializeMealSearchQuery(query: MealSearchQuery) {
  const params: Record<string, string | number> = {
    page: query.page,
    pageSize: query.pageSize,
  };

  const trimmedQuery = query.q.trim();
  if (trimmedQuery.length > 0) {
    params.q = trimmedQuery;
  }

  if (query.difficulty) {
    params.difficulty = query.difficulty;
  }

  const allergies = query.allergies?.trim();
  if (allergies) {
    params.allergies = allergies;
  }

  if (query.cookTimeMin != null) {
    params.cookTimeMin = query.cookTimeMin;
  }

  if (query.cookTimeMax != null) {
    params.cookTimeMax = query.cookTimeMax;
  }

  return params;
}

function createProtectedMealApiClient(config: AuthenticatedMealApiConfig) {
  return createAuthenticatedApiClient({
    apiBaseUrl: config.apiBaseUrl,
    accessToken: config.accessToken,
  });
}

function parseWithSchema<T>(
  schema: z.ZodType<T>,
  payload: unknown,
  config: {
    userMessage: string;
    failureMode?: 'request' | 'response';
  },
): T {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(config.userMessage);
  }

  return parsed.data;
}