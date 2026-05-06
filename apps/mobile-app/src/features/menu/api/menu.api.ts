import { z } from 'zod';

import {
  MenuItemCreateSchema,
  MenuItemSchema,
  MenuItemUpdateSchema,
  MenuResponseSchema,
  type MenuItem,
  type MenuItemCreate,
  type MenuItemUpdate,
  type MenuResponse,
} from '@meal/shared';
import { DateStringSchema, IntSchema } from '@meal/shared/types/common';
import type { MealDetailResponse } from '@meal/shared/types/meal';
import type { MealTime } from '@meal/shared/types/menu-item';

import { createAuthenticatedApiClient } from '@/services/api/http-client';
import { fetchMealDetail, formatCookTimeLabel } from '@features/meal/api/meal.api';

import {
  createEmptyMenuMealTimeGroups,
  type MenuDifficulty,
  type MenuMealItem,
  type MenuMealTimeGroup,
  type MenuNutrition,
} from '../utils/menu-meal-times';
import { formatMenuFlowDateFromApiDate } from '../utils/menu-flow';

const MENU_MEAL_TIMES: readonly MealTime[] = ['BREAKFAST', 'LUNCH', 'DINNER'];

export type PublicMenuApiConfig = {
  apiBaseUrl?: string;
};

export type AuthenticatedMenuApiConfig = PublicMenuApiConfig & {
  accessToken: string;
};

export type MenuScreenData = {
  date: string;
  hasMenu: boolean;
  nutritionTotal: MenuNutrition;
  mealTimeGroups: MenuMealTimeGroup[];
};

export async function fetchMenuDay(config: AuthenticatedMenuApiConfig & {
  date: string;
}): Promise<MenuResponse> {
  const client = createProtectedMenuApiClient(config);
  const date = parseWithSchema(
    DateStringSchema,
    config.date,
    { userMessage: 'Unable to load menu right now.', failureMode: 'request' },
  );

  const response = await client.get(`/v1/menus/day/${date}`);

  return parseWithSchema(
    MenuResponseSchema,
    response.data,
    { userMessage: 'Unable to load menu right now.' },
  );
}

export async function fetchMenuScreenData(config: AuthenticatedMenuApiConfig & {
  date: string;
}): Promise<MenuScreenData> {
  const response = await fetchMenuDay(config);
  const mealDetailById = await loadMenuMealDetails(config, response);

  return mapMenuResponseToScreenData(response, mealDetailById);
}

export async function createMenuItem(config: AuthenticatedMenuApiConfig & {
  payload: MenuItemCreate;
}): Promise<MenuItem> {
  const client = createProtectedMenuApiClient(config);
  const payload = parseWithSchema(
    MenuItemCreateSchema,
    config.payload,
    { userMessage: 'Unable to add this meal to your menu.', failureMode: 'request' },
  );

  const response = await client.post('/v1/menu-items', payload);

  return parseWithSchema(
    MenuItemSchema,
    response.data,
    { userMessage: 'Unable to add this meal to your menu.' },
  );
}

export async function updateMenuItem(config: AuthenticatedMenuApiConfig & {
  menuItemId: number;
  payload: MenuItemUpdate;
}): Promise<MenuItem> {
  const client = createProtectedMenuApiClient(config);
  const menuItemId = parseWithSchema(
    IntSchema,
    config.menuItemId,
    { userMessage: 'Unable to update this menu item right now.', failureMode: 'request' },
  );
  const payload = parseWithSchema(
    MenuItemUpdateSchema,
    config.payload,
    { userMessage: 'Unable to update this menu item right now.', failureMode: 'request' },
  );

  const response = await client.patch(`/v1/menu-items/${menuItemId}`, payload);

  return parseWithSchema(
    MenuItemSchema,
    response.data,
    { userMessage: 'Unable to update this menu item right now.' },
  );
}

export async function deleteMenuItem(config: AuthenticatedMenuApiConfig & {
  menuItemId: number;
}): Promise<void> {
  const client = createProtectedMenuApiClient(config);
  const menuItemId = parseWithSchema(
    IntSchema,
    config.menuItemId,
    { userMessage: 'Unable to remove this meal from your menu.', failureMode: 'request' },
  );

  await client.delete(`/v1/menu-items/${menuItemId}`);
}

export function mapMenuResponseToScreenData(
  response: MenuResponse,
  mealDetailById: ReadonlyMap<number, MealDetailResponse>,
): MenuScreenData {
  const mealTimeGroups = createEmptyMenuMealTimeGroups();
  const groupsByMealTime = new Map(
    mealTimeGroups.map((group) => [group.mealTime, group] as const),
  );
  const menuFlowDate = formatMenuFlowDateFromApiDate(response.date);

  for (const mealTime of MENU_MEAL_TIMES) {
    const currentGroup = groupsByMealTime.get(mealTime);
    if (!currentGroup) {
      continue;
    }

    currentGroup.items = response.meals[mealTime].map((item) => {
      const mealDetail = mealDetailById.get(item.mealId);
      if (!mealDetail) {
        throw new Error(`Unable to resolve meal details for menu item #${item.menuItemId}.`);
      }

      return mapMenuDayMealItemToViewModel(item, mealDetail, {
        date: menuFlowDate,
        mealTime,
      });
    });
  }

  return {
    date: response.date,
    hasMenu: response.hasMenu,
    nutritionTotal: {
      calories: response.nutritionTotal.calories,
      protein: response.nutritionTotal.protein,
      fiber: response.nutritionTotal.fiber,
      fat: response.nutritionTotal.fat,
    },
    mealTimeGroups,
  };
}

function mapMenuDayMealItemToViewModel(
  item: MenuResponse['meals'][MealTime][number],
  mealDetail: MealDetailResponse,
  context: {
    date: string;
    mealTime: MealTime;
  },
): MenuMealItem {
  return {
    menuItemId: item.menuItemId,
    mealId: item.mealId,
    mealName: item.mealName,
    date: context.date,
    mealTime: context.mealTime,
    portionSize: item.portionSize,
    eated: item.eated,
    cookTime: formatCookTimeLabel(mealDetail.cook_time_min),
    difficulty: formatMenuDifficultyLabel(mealDetail.difficulty),
    nutritionPerServing: {
      calories: mealDetail.total_calories,
      protein: mealDetail.total_protein,
      fiber: mealDetail.total_fiber,
      fat: mealDetail.total_fat,
    },
  };
}

async function loadMenuMealDetails(
  config: AuthenticatedMenuApiConfig,
  response: MenuResponse,
) {
  const mealIds = Array.from(
    new Set(
      MENU_MEAL_TIMES.flatMap((mealTime) =>
        response.meals[mealTime].map((item) => item.mealId),
      ),
    ),
  );

  const entries = await Promise.all(
    mealIds.map(async (mealId) => {
      const mealDetail = await fetchMealDetail({
        accessToken: config.accessToken,
        apiBaseUrl: config.apiBaseUrl,
        mealId,
      });

      return [mealId, mealDetail] as const;
    }),
  );

  return new Map(entries);
}

function formatMenuDifficultyLabel(
  difficulty: MealDetailResponse['difficulty'],
): MenuDifficulty {
  switch (difficulty) {
    case 'easy':
      return 'Easy';
    case 'medium':
      return 'Medium';
    case 'hard':
      return 'Hard';
  }
}

function createProtectedMenuApiClient(config: AuthenticatedMenuApiConfig) {
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