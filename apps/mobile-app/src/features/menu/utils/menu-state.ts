import {
  type MenuMealItem,
  type MenuMealTimeGroup,
  type MenuNutrition,
} from './menu-meal-times';

function roundTo2(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeNutritionValue(value: number) {
  const roundedValue = roundTo2(value);

  return roundedValue <= 0 ? 0 : roundedValue;
}

function scaleNutritionExact(
  nutrition: MenuNutrition,
  portionSize: number,
): MenuNutrition {
  return {
    calories: nutrition.calories * portionSize,
    protein: nutrition.protein * portionSize,
    fiber: nutrition.fiber * portionSize,
    fat: nutrition.fat * portionSize,
  };
}

function combineNutrition(
  left: MenuNutrition,
  right: MenuNutrition,
  operator: 1 | -1,
): MenuNutrition {
  return {
    calories: normalizeNutritionValue(left.calories + operator * right.calories),
    protein: normalizeNutritionValue(left.protein + operator * right.protein),
    fiber: normalizeNutritionValue(left.fiber + operator * right.fiber),
    fat: normalizeNutritionValue(left.fat + operator * right.fat),
  };
}

export function parsePositivePortionSize(value: string) {
  const normalizedValue = value.replace(',', '.').trim();
  const parsedValue = Number.parseFloat(normalizedValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

export function replaceMenuMealItemInGroups(
  groups: readonly MenuMealTimeGroup[],
  nextItem: MenuMealItem,
): MenuMealTimeGroup[] {
  return groups.map((group) => {
    if (group.mealTime !== nextItem.mealTime) {
      return group;
    }

    return {
      ...group,
      items: group.items.map((item) =>
        item.menuItemId === nextItem.menuItemId ? nextItem : item,
      ),
    };
  });
}

export function removeMenuMealItemFromGroups(
  groups: readonly MenuMealTimeGroup[],
  menuItemId: number,
): MenuMealTimeGroup[] {
  return groups.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.menuItemId !== menuItemId),
  }));
}

export function applyMenuItemPortionSizeToNutritionTotal(
  currentTotal: MenuNutrition,
  item: MenuMealItem,
  nextPortionSize: number,
): MenuNutrition {
  const previousNutrition = scaleNutritionExact(
    item.nutritionPerServing,
    item.portionSize,
  );
  const nextNutrition = scaleNutritionExact(item.nutritionPerServing, nextPortionSize);

  return combineNutrition(
    combineNutrition(currentTotal, previousNutrition, -1),
    nextNutrition,
    1,
  );
}

export function removeMenuItemNutritionFromTotal(
  currentTotal: MenuNutrition,
  item: MenuMealItem,
): MenuNutrition {
  return combineNutrition(
    currentTotal,
    scaleNutritionExact(item.nutritionPerServing, item.portionSize),
    -1,
  );
}