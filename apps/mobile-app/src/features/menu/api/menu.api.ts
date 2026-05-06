import { z } from 'zod';

import {
  MenuItemCreateSchema,
  MenuItemSchema,
  MenuItemUpdateSchema,
  MenuResponseSchema,
  type MealTime,
  type MenuItem,
  type MenuItemCreate,
  type MenuItemUpdate,
  type MenuResponse,
} from '@meal/shared';
import { DateStringSchema, IntSchema } from '@meal/shared/types/common';

import { createAuthenticatedApiClient } from '@/services/api/http-client';

import {
  createEmptyMenuMealTimeGroups,
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

  return mapMenuResponseToScreenData(response);
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
      return mapMenuDayMealItemToViewModel(item, {
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
    nutritionPerServing: {
      calories: item.nutritionPerServing.calories,
      protein: item.nutritionPerServing.protein,
      fiber: item.nutritionPerServing.fiber,
      fat: item.nutritionPerServing.fat,
    },
  };
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