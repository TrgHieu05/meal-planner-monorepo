import type { MealTime } from '@meal/shared/types/menu-item';

export type MenuFlowMealTimeParam = 'breakfast' | 'lunch' | 'dinner';

const MENU_FLOW_MEAL_TIME_LABELS: Record<MenuFlowMealTimeParam, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

export function getSingleSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export function formatMenuFlowDateParam(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());

  return `${day}.${month}.${year}`;
}

export function toMenuFlowMealTimeParam(mealTime: MealTime): MenuFlowMealTimeParam {
  return mealTime.toLowerCase() as MenuFlowMealTimeParam;
}

export function formatMenuFlowMealTimeLabel(mealTime?: string) {
  if (!mealTime) {
    return undefined;
  }

  const normalizedMealTime = mealTime.toLowerCase() as MenuFlowMealTimeParam;

  return MENU_FLOW_MEAL_TIME_LABELS[normalizedMealTime] ?? mealTime;
}

export function buildAddToMenuLabel(mealTime?: string, date?: string) {
  const mealTimeLabel = formatMenuFlowMealTimeLabel(mealTime);

  if (!mealTimeLabel || !date) {
    return undefined;
  }

  return `Add to ${mealTimeLabel}, ${date}`;
}