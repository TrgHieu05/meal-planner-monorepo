import type { MealTime } from '@meal/shared/types/menu-item';

import { cloneCalendarDate } from './week-date';

export type MenuDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface MenuNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MenuMealItem {
  menuItemId: number;
  mealId: string;
  mealName: string;
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

type MenuItemTemplate = Omit<MenuMealItem, 'menuItemId' | 'portionSize' | 'eated'>;

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

const MENU_ITEM_TEMPLATES = {
  avocadoToast: {
    mealId: 'menu-meal-avocado-toast',
    mealName: 'Avocado Toast',
    cookTime: '15 mins',
    difficulty: 'Easy',
    nutritionPerServing: {
      calories: 380,
      protein: 12,
      carbs: 14,
      fat: 16,
    },
  },
  scrambledEggs: {
    mealId: 'menu-meal-scrambled-eggs',
    mealName: 'Scrambled Eggs',
    cookTime: '10 mins',
    difficulty: 'Easy',
    nutritionPerServing: {
      calories: 290,
      protein: 22,
      carbs: 24,
      fat: 3,
    },
  },
  grilledChickenSalad: {
    mealId: 'menu-meal-grilled-chicken-salad',
    mealName: 'Grilled Chicken Salad',
    cookTime: '20 mins',
    difficulty: 'Medium',
    nutritionPerServing: {
      calories: 520,
      protein: 38,
      carbs: 42,
      fat: 18,
    },
  },
  salmonBowl: {
    mealId: 'menu-meal-salmon-bowl',
    mealName: 'Grilled Salmon Bowl',
    cookTime: '20 mins',
    difficulty: 'Medium',
    nutritionPerServing: {
      calories: 450,
      protein: 35,
      carbs: 12,
      fat: 22,
    },
  },
  tofuStirFry: {
    mealId: 'menu-meal-tofu-stir-fry',
    mealName: 'Tofu Veggie Stir Fry',
    cookTime: '25 mins',
    difficulty: 'Medium',
    nutritionPerServing: {
      calories: 410,
      protein: 22,
      carbs: 36,
      fat: 13,
    },
  },
} as const satisfies Record<string, MenuItemTemplate>;

function roundToOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

export function formatMenuNutritionValue(value: number) {
  const roundedValue = roundToOneDecimal(value);

  return Number.isInteger(roundedValue) ? `${roundedValue}` : `${roundedValue}`;
}

function createMealItem(
  template: MenuItemTemplate,
  menuItemId: number,
  overrides: Partial<Pick<MenuMealItem, 'portionSize' | 'eated'>> = {},
): MenuMealItem {
  return {
    ...template,
    menuItemId,
    portionSize: overrides.portionSize ?? 1,
    eated: overrides.eated ?? false,
  };
}

export function getMealTimeMeta(mealTime: MealTime) {
  return MEAL_TIME_META[mealTime];
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
    carbs: roundToOneDecimal(nutrition.carbs * portionSize),
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
        carbs: roundToOneDecimal(totals.carbs + scaledNutrition.carbs),
        fat: roundToOneDecimal(totals.fat + scaledNutrition.fat),
      };
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
  );
}

export function formatMenuItemNutritionLine(nutrition: MenuNutrition) {
  return `${formatMenuNutritionValue(nutrition.calories)} kcal · ${formatMenuNutritionValue(nutrition.protein)}p · ${formatMenuNutritionValue(nutrition.carbs)}c · ${formatMenuNutritionValue(nutrition.fat)}f`;
}

export function formatMenuNutritionSummary(nutrition: MenuNutrition) {
  return `Protein ${formatMenuNutritionValue(nutrition.protein)} g · Carbs ${formatMenuNutritionValue(nutrition.carbs)} g · Fat ${formatMenuNutritionValue(nutrition.fat)} g`;
}

function createPastMealTimes(): MenuMealTimeGroup[] {
  return [
    {
      mealTime: 'BREAKFAST',
      ...getMealTimeMeta('BREAKFAST'),
      items: [
        createMealItem(MENU_ITEM_TEMPLATES.avocadoToast, 101, { eated: true }),
        createMealItem(MENU_ITEM_TEMPLATES.scrambledEggs, 102, { eated: true }),
      ],
    },
    {
      mealTime: 'LUNCH',
      ...getMealTimeMeta('LUNCH'),
      items: [createMealItem(MENU_ITEM_TEMPLATES.grilledChickenSalad, 201, { eated: true })],
    },
    {
      mealTime: 'DINNER',
      ...getMealTimeMeta('DINNER'),
      items: [],
    },
  ];
}

function createTodayMealTimes(): MenuMealTimeGroup[] {
  return [
    {
      mealTime: 'BREAKFAST',
      ...getMealTimeMeta('BREAKFAST'),
      items: [
        createMealItem(MENU_ITEM_TEMPLATES.avocadoToast, 301),
        createMealItem(MENU_ITEM_TEMPLATES.scrambledEggs, 302),
      ],
    },
    {
      mealTime: 'LUNCH',
      ...getMealTimeMeta('LUNCH'),
      items: [createMealItem(MENU_ITEM_TEMPLATES.salmonBowl, 401, { portionSize: 1.2 })],
    },
    {
      mealTime: 'DINNER',
      ...getMealTimeMeta('DINNER'),
      items: [],
    },
  ];
}

function createUpcomingMealTimes(): MenuMealTimeGroup[] {
  return [
    {
      mealTime: 'BREAKFAST',
      ...getMealTimeMeta('BREAKFAST'),
      items: [],
    },
    {
      mealTime: 'LUNCH',
      ...getMealTimeMeta('LUNCH'),
      items: [createMealItem(MENU_ITEM_TEMPLATES.grilledChickenSalad, 501, { portionSize: 1.5 })],
    },
    {
      mealTime: 'DINNER',
      ...getMealTimeMeta('DINNER'),
      items: [createMealItem(MENU_ITEM_TEMPLATES.tofuStirFry, 601, { portionSize: 1.1 })],
    },
  ];
}

export function createMockMenuMealTimes(selectedDate: Date, today: Date) {
  const dayComparison = compareCalendarDates(selectedDate, today);

  if (dayComparison < 0) {
    return createPastMealTimes();
  }

  if (dayComparison === 0) {
    return createTodayMealTimes();
  }

  return createUpcomingMealTimes();
}