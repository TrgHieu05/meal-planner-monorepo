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
  return {
    source: context.source,
    mealTime: toMenuFlowMealTimeParam(context.mealTime),
    templateDayNumber: `${context.dayNumber}`,
    templateDayUiKey: context.dayUiKey,
  };
}

export function buildTemplateMealPickerLabel(context: TemplateMealPickerContext) {
  const mealTimeLabel = formatMenuFlowMealTimeLabel(toMenuFlowMealTimeParam(context.mealTime));

  if (!mealTimeLabel) {
    return 'Add to Template';
  }

  return `Add to Day ${context.dayNumber} ${mealTimeLabel}`;
}

export function parseTemplateMealPickerContext(params: {
  mealTime?: TemplateMealPickerParamValue;
  source?: TemplateMealPickerParamValue;
  templateDayNumber?: TemplateMealPickerParamValue;
  templateDayUiKey?: TemplateMealPickerParamValue;
}): TemplateMealPickerContext | null {
  const source = getSingleSearchParam(params.source);
  const templateDayUiKey = getSingleSearchParam(params.templateDayUiKey)?.trim();
  const templateDayNumber = Number.parseInt(
    getSingleSearchParam(params.templateDayNumber) ?? '',
    10,
  );
  const mealTime = toMealTimeFromMenuFlowParam(getSingleSearchParam(params.mealTime));

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
    nutritionPerServing: {
      ...selection.nutritionPerServing,
    },
  };
}