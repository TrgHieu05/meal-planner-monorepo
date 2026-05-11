import { describe, expect, it } from '@jest/globals';

import {
  buildTemplateMealDuplicateWarning,
  buildTemplateMealPickerLabel,
  buildTemplateMealPickerParams,
  clearPendingTemplateMealSelection,
  consumePendingTemplateMealSelection,
  parseTemplateMealPickerContext,
  peekPendingTemplateMealSelection,
  stagePendingTemplateMealSelection,
} from './template-meal-picker';

describe('template-meal-picker helpers', () => {
  it('builds and parses template picker route params with stable day context', () => {
    const params = buildTemplateMealPickerParams({
      source: 'template',
      dayNumber: 2,
      dayUiKey: 'template-day-7',
      existingMealIds: [21, 33, 21],
      mealTime: 'DINNER',
    });

    expect(params).toEqual({
      source: 'template',
      mealTime: 'dinner',
      templateDayNumber: '2',
      templateDayUiKey: 'template-day-7',
      templateExistingMealIds: '21,33',
    });
    expect(parseTemplateMealPickerContext(params)).toEqual({
      source: 'template',
      dayNumber: 2,
      dayUiKey: 'template-day-7',
      existingMealIds: [21, 33],
      mealTime: 'DINNER',
    });
    expect(buildTemplateMealPickerLabel({
      source: 'template',
      dayNumber: 2,
      dayUiKey: 'template-day-7',
      existingMealIds: [21, 33],
      mealTime: 'DINNER',
    })).toBe('Add to Day 2 Dinner');
    expect(buildTemplateMealDuplicateWarning({
      source: 'template',
      dayNumber: 2,
      dayUiKey: 'template-day-7',
      existingMealIds: [21, 33],
      mealTime: 'DINNER',
    })).toBe('This meal is already in Day 2 Dinner. Choose another meal or edit the existing item.');
  });

  it('stages and consumes a pending template meal selection exactly once', () => {
    clearPendingTemplateMealSelection();

    stagePendingTemplateMealSelection({
      source: 'template',
      dayNumber: 1,
      dayUiKey: 'template-day-1',
      existingMealIds: [101],
      mealTime: 'BREAKFAST',
      mealId: 101,
      mealName: 'Berry Yogurt Bowl',
      cookTime: '15 mins',
      difficulty: 'Easy',
      nutritionPerServing: {
        calories: 380,
        protein: 18,
        fiber: 7,
        fat: 12,
      },
    });

    expect(peekPendingTemplateMealSelection()).toMatchObject({
      mealId: 101,
      mealTime: 'BREAKFAST',
      dayUiKey: 'template-day-1',
      existingMealIds: [101],
    });
    expect(consumePendingTemplateMealSelection()).toMatchObject({
      mealName: 'Berry Yogurt Bowl',
      nutritionPerServing: {
        calories: 380,
        protein: 18,
        fiber: 7,
        fat: 12,
      },
    });
    expect(consumePendingTemplateMealSelection()).toBeNull();
  });
});