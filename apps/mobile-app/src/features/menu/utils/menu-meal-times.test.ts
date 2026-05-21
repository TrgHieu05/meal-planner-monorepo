import { describe, expect, it } from '@jest/globals';

import { sumLoggedMenuNutrition } from './menu-meal-times';
import type { MenuMealItem, MenuMealTimeGroup } from './menu-meal-times';

function createMenuItem(overrides: Partial<MenuMealItem> = {}): MenuMealItem {
  return {
    menuItemId: 17,
    mealId: 7,
    mealName: 'Turkey Quinoa Salad',
    date: '06.05.2026',
    mealTime: 'LUNCH',
    portionSize: 1,
    eated: false,
    nutritionPerServing: {
      calories: 340,
      protein: 27,
      fiber: 7.5,
      fat: 11,
    },
    ...overrides,
  };
}

function createMealTimeGroups(items: MenuMealItem[]): MenuMealTimeGroup[] {
  return [
    {
      mealTime: 'BREAKFAST',
      label: 'Breakfast',
      timeRange: '7-9 AM',
      items: [],
    },
    {
      mealTime: 'LUNCH',
      label: 'Lunch',
      timeRange: '12-2 PM',
      items,
    },
    {
      mealTime: 'DINNER',
      label: 'Dinner',
      timeRange: '6-8 PM',
      items: [],
    },
  ];
}

describe('menu-meal-times helpers', () => {
  it('sums only logged menu item nutrition for progress-card totals', () => {
    const loggedItem = createMenuItem({
      menuItemId: 11,
      eated: true,
      portionSize: 1.5,
    });
    const unloggedItem = createMenuItem({
      menuItemId: 12,
      eated: false,
      portionSize: 2,
      nutritionPerServing: {
        calories: 500,
        protein: 20,
        fiber: 4,
        fat: 15,
      },
    });

    expect(sumLoggedMenuNutrition(createMealTimeGroups([loggedItem, unloggedItem]))).toEqual({
      calories: 510,
      protein: 40.5,
      fiber: 11.3,
      fat: 16.5,
    });
  });
});