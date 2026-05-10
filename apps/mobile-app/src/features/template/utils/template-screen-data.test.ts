import { describe, expect, it } from '@jest/globals';

import {
  createTemplateDay,
  createTemplateDayUiKey,
  createTemplateEditorMealItem,
  getNextTemplateMealItemId,
  renumberTemplateDays,
} from './template-screen-data';

describe('template-screen-data helpers', () => {
  it('creates an empty day with a real day number and stable default ui key', () => {
    const day = createTemplateDay({ dayNumber: 1 });

    expect(day).toMatchObject({
      dayNumber: 1,
      uiKey: createTemplateDayUiKey(1),
    });
    expect(day.mealTimeGroups.flatMap((group) => group.items)).toEqual([]);
  });

  it('renumbers days sequentially without changing their ui keys', () => {
    const days = [
      createTemplateDay({ dayNumber: 1, uiKey: 'keep-1' }),
      createTemplateDay({ dayNumber: 3, uiKey: 'keep-3' }),
    ];

    expect(renumberTemplateDays(days)).toEqual([
      expect.objectContaining({ dayNumber: 1, uiKey: 'keep-1' }),
      expect.objectContaining({ dayNumber: 2, uiKey: 'keep-3' }),
    ]);
  });

  it('supports create flow starting from a single empty day instead of sample days', () => {
    const draftDays = [createTemplateDay({ dayNumber: 1 })];

    expect(draftDays).toHaveLength(1);
    expect(draftDays[0]).toMatchObject({
      dayNumber: 1,
      uiKey: createTemplateDayUiKey(1),
    });
    expect(draftDays[0]?.mealTimeGroups.flatMap((group) => group.items)).toEqual([]);
  });

  it('creates a local template editor meal item with stable day label and nutrition payload', () => {
    expect(
      createTemplateEditorMealItem({
        dayNumber: 2,
        menuItemId: 7,
        mealId: 33,
        mealName: 'Tofu Stir Fry',
        mealTime: 'DINNER',
        cookTime: '25 mins',
        difficulty: 'Medium',
        nutritionPerServing: {
          calories: 560,
          protein: 27,
          fiber: 11,
          fat: 20,
        },
      }),
    ).toEqual({
      menuItemId: 7,
      mealId: 33,
      mealName: 'Tofu Stir Fry',
      date: 'Day 2',
      mealTime: 'DINNER',
      portionSize: 1,
      eated: false,
      cookTime: '25 mins',
      difficulty: 'Medium',
      nutritionPerServing: {
        calories: 560,
        protein: 27,
        fiber: 11,
        fat: 20,
      },
    });
  });

  it('derives the next local template meal item id from the current draft state', () => {
    const days = [
      createTemplateDay({
        dayNumber: 1,
        mealsByTime: {
          BREAKFAST: [
            createTemplateEditorMealItem({
              dayNumber: 1,
              menuItemId: 3,
              mealId: 11,
              mealName: 'Avocado Toast',
              mealTime: 'BREAKFAST',
              nutritionPerServing: {
                calories: 320,
                protein: 12,
                fiber: 6,
                fat: 14,
              },
            }),
          ],
        },
      }),
      createTemplateDay({
        dayNumber: 2,
        mealsByTime: {
          DINNER: [
            createTemplateEditorMealItem({
              dayNumber: 2,
              menuItemId: 8,
              mealId: 33,
              mealName: 'Tofu Stir Fry',
              mealTime: 'DINNER',
              nutritionPerServing: {
                calories: 560,
                protein: 27,
                fiber: 11,
                fat: 20,
              },
            }),
          ],
        },
      }),
    ];

    expect(getNextTemplateMealItemId(days)).toBe(9);
  });
});