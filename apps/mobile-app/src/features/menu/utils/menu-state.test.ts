import { describe, expect, it } from '@jest/globals';

import {
  applyMenuItemPortionSizeToNutritionTotal,
  parsePositivePortionSize,
  removeMenuItemNutritionFromTotal,
  removeMenuMealItemFromGroups,
  replaceMenuMealItemInGroups,
} from './menu-state';
import type { MenuMealItem, MenuMealTimeGroup, MenuNutrition } from './menu-meal-times';

function createMenuItem(overrides: Partial<MenuMealItem> = {}): MenuMealItem {
  return {
    menuItemId: 17,
    mealId: 7,
    mealName: 'Turkey Quinoa Salad',
    date: '06.05.2026',
    mealTime: 'LUNCH',
    portionSize: 1.25,
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

function createNutritionTotal(overrides: Partial<MenuNutrition> = {}): MenuNutrition {
  return {
    calories: 640,
    protein: 49,
    fiber: 11.5,
    fat: 20,
    ...overrides,
  };
}

function createMealTimeGroups(item: MenuMealItem): MenuMealTimeGroup[] {
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
      items: [item],
    },
    {
      mealTime: 'DINNER',
      label: 'Dinner',
      timeRange: '6-8 PM',
      items: [],
    },
  ];
}

describe('menu-state helpers', () => {
  it('parses only positive portion sizes', () => {
    expect(parsePositivePortionSize('1.5')).toBe(1.5);
    expect(parsePositivePortionSize(' 2,25 ')).toBe(2.25);
    expect(parsePositivePortionSize('0')).toBeNull();
    expect(parsePositivePortionSize('-3')).toBeNull();
    expect(parsePositivePortionSize('abc')).toBeNull();
  });

  it('replaces a single menu item in its meal-time group', () => {
    const item = createMenuItem();
    const nextItem = createMenuItem({ portionSize: 2, eated: true });

    const groups = replaceMenuMealItemInGroups(createMealTimeGroups(item), nextItem);

    expect(groups[1]?.items[0]).toEqual(nextItem);
  });

  it('removes a deleted menu item from the existing groups', () => {
    const item = createMenuItem();

    const groups = removeMenuMealItemFromGroups(createMealTimeGroups(item), item.menuItemId);

    expect(groups[1]?.items).toEqual([]);
  });

  it('recalculates nutrition total when portion size changes without refetching the whole day', () => {
    const item = createMenuItem();

    expect(
      applyMenuItemPortionSizeToNutritionTotal(createNutritionTotal(), item, 2),
    ).toEqual({
      calories: 895,
      protein: 69.25,
      fiber: 17.13,
      fat: 28.25,
    });
  });

  it('subtracts deleted item nutrition from the existing daily total', () => {
    const item = createMenuItem();

    expect(
      removeMenuItemNutritionFromTotal(createNutritionTotal(), item),
    ).toEqual({
      calories: 215,
      protein: 15.25,
      fiber: 2.13,
      fat: 6.25,
    });
  });
});