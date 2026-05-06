import type { MealTime } from '@meal/shared';

import { cloneCalendarDate } from './week-date';

export type MenuDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface MenuNutrition {
  calories: number;
  protein: number;
  fiber: number;
  fat: number;
}

export interface MenuMealItem {
  menuItemId: number;
  mealId: number;
  mealName: string;
  date: string;
  mealTime: MealTime;
  portionSize: number;
  eated: boolean;
  cookTime: string;
  difficulty: MenuDifficulty;
  nutritionPerServing: MenuNutrition;
}

export interface MenuMealTimeGroup {
  mealTime: MealTime;
  label: string;
  timeRange: string;
  items: MenuMealItem[];
}

const MEAL_TIME_META: Record<MealTime, Pick<MenuMealTimeGroup, 'label' | 'timeRange'>> = {
  BREAKFAST: {
    label: 'Breakfast',
    timeRange: '7-9 AM',
  },
  LUNCH: {
    label: 'Lunch',
    timeRange: '12-2 PM',
  },
  DINNER: {
    label: 'Dinner',
    timeRange: '6-8 PM',
  },
};

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

export function formatMenuNutritionValue(value: number) {
  const roundedValue = roundToOneDecimal(value);

  return Number.isInteger(roundedValue) ? `${roundedValue}` : `${roundedValue}`;
}

export function getMealTimeMeta(mealTime: MealTime) {
  return MEAL_TIME_META[mealTime];
}

export function createEmptyMenuMealTimeGroups(): MenuMealTimeGroup[] {
  return (['BREAKFAST', 'LUNCH', 'DINNER'] as const).map((mealTime) => ({
    mealTime,
    ...getMealTimeMeta(mealTime),
    items: [],
  }));
}

export function compareCalendarDates(left: Date, right: Date) {
  return cloneCalendarDate(left).getTime() - cloneCalendarDate(right).getTime();
}

export function isPastCalendarDate(date: Date, today: Date) {
  return compareCalendarDates(date, today) < 0;
}

export function scaleMenuNutrition(nutrition: MenuNutrition, portionSize: number): MenuNutrition {
  return {
    calories: roundToOneDecimal(nutrition.calories * portionSize),
    protein: roundToOneDecimal(nutrition.protein * portionSize),
    fiber: roundToOneDecimal(nutrition.fiber * portionSize),
    fat: roundToOneDecimal(nutrition.fat * portionSize),
  };
}

export function sumMenuMealTimeNutrition(items: readonly MenuMealItem[]) {
  return items.reduce<MenuNutrition>(
    (totals, item) => {
      const scaledNutrition = scaleMenuNutrition(item.nutritionPerServing, item.portionSize);

      return {
        calories: roundToOneDecimal(totals.calories + scaledNutrition.calories),
        protein: roundToOneDecimal(totals.protein + scaledNutrition.protein),
        fiber: roundToOneDecimal(totals.fiber + scaledNutrition.fiber),
        fat: roundToOneDecimal(totals.fat + scaledNutrition.fat),
      };
    },
    {
      calories: 0,
      protein: 0,
      fiber: 0,
      fat: 0,
    },
  );
}

export function formatMenuItemNutritionLine(nutrition: MenuNutrition) {
  return `${formatMenuNutritionValue(nutrition.calories)} kcal · ${formatMenuNutritionValue(nutrition.protein)}p · ${formatMenuNutritionValue(nutrition.fiber)} fib · ${formatMenuNutritionValue(nutrition.fat)}f`;
}

export function formatMenuNutritionSummary(nutrition: MenuNutrition) {
  return `Protein ${formatMenuNutritionValue(nutrition.protein)} g · Fiber ${formatMenuNutritionValue(nutrition.fiber)} g · Fat ${formatMenuNutritionValue(nutrition.fat)} g`;
}
