import {
  mergeMealSearchScreenData,
  shouldLoadMoreForScroll,
} from './meal-search-pagination';

describe('meal-search pagination helpers', () => {
  it('loads more when the user scrolls near the bottom', () => {
    expect(
      shouldLoadMoreForScroll({
        viewportHeight: 400,
        offsetY: 610,
        contentHeight: 1100,
      }),
    ).toBe(true);

    expect(
      shouldLoadMoreForScroll({
        viewportHeight: 400,
        offsetY: 200,
        contentHeight: 1100,
      }),
    ).toBe(false);
  });

  it('appends only new meals when merging pages', () => {
    const merged = mergeMealSearchScreenData(
      {
        list: [
          {
            mealId: 1,
            mealName: 'Meal 1',
            mealImageKey: null,
            cookTime: '15 mins',
            difficulty: 'Easy',
            totalCalories: '300',
            totalProtein: '20',
            totalFiber: '4',
            totalFat: '10',
            score: 1,
          },
        ],
        page: 1,
        pageSize: 10,
        total: 12,
        hasMore: true,
      },
      {
        list: [
          {
            mealId: 1,
            mealName: 'Meal 1 updated',
            mealImageKey: null,
            cookTime: '15 mins',
            difficulty: 'Easy',
            totalCalories: '300',
            totalProtein: '20',
            totalFiber: '4',
            totalFat: '10',
            score: 1,
          },
          {
            mealId: 2,
            mealName: 'Meal 2',
            mealImageKey: null,
            cookTime: '25 mins',
            difficulty: 'Medium',
            totalCalories: '420',
            totalProtein: '25',
            totalFiber: '6',
            totalFat: '12',
            score: 2,
          },
        ],
        page: 2,
        pageSize: 10,
        total: 12,
        hasMore: false,
      },
    );

    expect(merged.page).toBe(2);
    expect(merged.hasMore).toBe(false);
    expect(merged.list).toEqual([
      {
        mealId: 1,
        mealName: 'Meal 1 updated',
        mealImageKey: null,
        cookTime: '15 mins',
        difficulty: 'Easy',
        totalCalories: '300',
        totalProtein: '20',
        totalFiber: '4',
        totalFat: '10',
        score: 1,
      },
      {
        mealId: 2,
        mealName: 'Meal 2',
        mealImageKey: null,
        cookTime: '25 mins',
        difficulty: 'Medium',
        totalCalories: '420',
        totalProtein: '25',
        totalFiber: '6',
        totalFat: '12',
        score: 2,
      },
    ]);
  });
});