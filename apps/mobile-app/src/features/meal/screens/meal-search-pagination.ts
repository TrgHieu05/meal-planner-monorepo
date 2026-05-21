import type { MealSearchScreenData } from '../types';

export const DEFAULT_MEAL_LOAD_MORE_THRESHOLD = 120;

export function shouldLoadMoreForScroll(params: {
  viewportHeight: number;
  offsetY: number;
  contentHeight: number;
  threshold?: number;
}) {
  if (params.viewportHeight <= 0 || params.contentHeight <= 0) {
    return false;
  }

  const threshold = params.threshold ?? DEFAULT_MEAL_LOAD_MORE_THRESHOLD;

  return params.viewportHeight + params.offsetY >= params.contentHeight - threshold;
}

export function mergeMealSearchScreenData(
  currentData: MealSearchScreenData,
  nextData: MealSearchScreenData,
): MealSearchScreenData {
  const mergedItems = new Map(
    currentData.list.map((item) => [item.mealId, item] as const),
  );

  nextData.list.forEach((item) => {
    mergedItems.set(item.mealId, item);
  });

  return {
    ...nextData,
    list: Array.from(mergedItems.values()),
  };
}