import type { MealTime } from '@meal/shared';

import {
  formatMenuFlowMealTimeLabel,
  getSingleSearchParam,
  toMealTimeFromMenuFlowParam,
  toMenuFlowMealTimeParam,
} from '@features/menu/utils/menu-flow';
import type { MenuDifficulty, MenuNutrition } from '@features/menu/utils/menu-meal-times';

export type TemplateMealPickerContext = {
  dayNumber: number;
  dayUiKey: string;
  existingMealIds: number[];
  mealTime: MealTime;
  source: 'template';
};

export type PendingTemplateMealSelection = TemplateMealPickerContext & {
  cookTime?: string;
  difficulty?: MenuDifficulty;
  mealId: number;
  mealName: string;
  nutritionPerServing: MenuNutrition;
};

type TemplateMealPickerParamValue = string | string[] | undefined;

let pendingTemplateMealSelection: PendingTemplateMealSelection | null = null;

export function buildTemplateMealPickerParams(context: TemplateMealPickerContext) {
  const existingMealIds = normalizeTemplateExistingMealIds(context.existingMealIds);

  return {
    source: context.source,
    mealTime: toMenuFlowMealTimeParam(context.mealTime),
    templateDayNumber: `${context.dayNumber}`,
    templateDayUiKey: context.dayUiKey,
    ...(existingMealIds.length > 0
      ? {
          templateExistingMealIds: existingMealIds.join(','),
        }
      : {}),
  };
}

export function buildTemplateMealPickerLabel(context: TemplateMealPickerContext) {
  const mealTimeLabel = formatMenuFlowMealTimeLabel(toMenuFlowMealTimeParam(context.mealTime));

  if (!mealTimeLabel) {
    return 'Add to Template';
  }

  return `Add to Day ${context.dayNumber} ${mealTimeLabel}`;
}

export function buildTemplateMealDuplicateWarning(context: TemplateMealPickerContext) {
  const mealTimeLabel = formatMenuFlowMealTimeLabel(toMenuFlowMealTimeParam(context.mealTime));

  if (!mealTimeLabel) {
    return 'This meal is already in the selected template day. Choose another meal or edit the existing item.';
  }

  return `This meal is already in Day ${context.dayNumber} ${mealTimeLabel}. Choose another meal or edit the existing item.`;
}

export function parseTemplateMealPickerContext(params: {
  mealTime?: TemplateMealPickerParamValue;
  source?: TemplateMealPickerParamValue;
  templateDayNumber?: TemplateMealPickerParamValue;
  templateDayUiKey?: TemplateMealPickerParamValue;
  templateExistingMealIds?: TemplateMealPickerParamValue;
}): TemplateMealPickerContext | null {
  const source = getSingleSearchParam(params.source);
  const templateDayUiKey = getSingleSearchParam(params.templateDayUiKey)?.trim();
  const templateDayNumber = Number.parseInt(
    getSingleSearchParam(params.templateDayNumber) ?? '',
    10,
  );
  const mealTime = toMealTimeFromMenuFlowParam(getSingleSearchParam(params.mealTime));
  const existingMealIds = normalizeTemplateExistingMealIds(
    getSingleSearchParam(params.templateExistingMealIds),
  );

  if (
    source !== 'template' ||
    !templateDayUiKey ||
    !Number.isInteger(templateDayNumber) ||
    templateDayNumber <= 0 ||
    !mealTime
  ) {
    return null;
  }

  return {
    source,
    dayUiKey: templateDayUiKey,
    dayNumber: templateDayNumber,
    existingMealIds,
    mealTime,
  };
}

export function stagePendingTemplateMealSelection(selection: PendingTemplateMealSelection) {
  pendingTemplateMealSelection = clonePendingTemplateMealSelection(selection);
}

export function peekPendingTemplateMealSelection() {
  return pendingTemplateMealSelection
    ? clonePendingTemplateMealSelection(pendingTemplateMealSelection)
    : null;
}

export function consumePendingTemplateMealSelection() {
  const selection = pendingTemplateMealSelection
    ? clonePendingTemplateMealSelection(pendingTemplateMealSelection)
    : null;

  pendingTemplateMealSelection = null;
  return selection;
}

export function clearPendingTemplateMealSelection() {
  pendingTemplateMealSelection = null;
}

function clonePendingTemplateMealSelection(selection: PendingTemplateMealSelection): PendingTemplateMealSelection {
  return {
    ...selection,
    existingMealIds: [...selection.existingMealIds],
    nutritionPerServing: {
      ...selection.nutritionPerServing,
    },
  };
}

function normalizeTemplateExistingMealIds(value: number[] | string | undefined) {
  const rawValues = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  const normalizedIds = rawValues
    .map((item) => (typeof item === 'number' ? item : Number.parseInt(item.trim(), 10)))
    .filter((item): item is number => Number.isInteger(item) && item > 0);

  return Array.from(new Set(normalizedIds));
}