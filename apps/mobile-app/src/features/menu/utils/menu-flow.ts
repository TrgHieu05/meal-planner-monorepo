import type { MealTime } from '@meal/shared';

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

export function formatMenuApiDate(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());

  return `${year}-${month}-${day}`;
}

export function parseMenuFlowDateParam(value?: string) {
  if (!value) {
    return null;
  }

  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(year, month - 1, day);
  date.setHours(12, 0, 0, 0);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function formatMenuFlowDateFromApiDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return value;
  }

  const [, year, month, day] = match;
  return `${day}.${month}.${year}`;
}

export function toMenuFlowMealTimeParam(mealTime: MealTime): MenuFlowMealTimeParam {
  return mealTime.toLowerCase() as MenuFlowMealTimeParam;
}

export function toMealTimeFromMenuFlowParam(mealTime?: string) {
  if (!mealTime) {
    return null;
  }

  switch (mealTime.toLowerCase()) {
    case 'breakfast':
      return 'BREAKFAST' satisfies MealTime;
    case 'lunch':
      return 'LUNCH' satisfies MealTime;
    case 'dinner':
      return 'DINNER' satisfies MealTime;
    default:
      return null;
  }
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