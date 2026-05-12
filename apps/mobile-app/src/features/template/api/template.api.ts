import { z } from 'zod';

import {
  AddMealTemplateItemRequestSchema,
  ApplyMealTemplateRequestSchema,
  ApplyMealTemplateResponseSchema,
  CreateMealTemplateRequestSchema,
  MealTemplateDetailResponseSchema,
  MealTemplateItemResponseSchema,
  MealTemplateListResponseSchema,
  UpdateMealTemplateItemRequestSchema,
  UpdateMealTemplateRequestSchema,
  UpsertMealTemplateDayRequestSchema,
  type AddMealTemplateItemRequest,
  type ApplyMealTemplateRequest,
  type ApplyMealTemplateResponse,
  type CreateMealTemplateRequest,
  type MealTemplateDetailResponse,
  type MealTemplateItemResponse,
  type MealTemplateListItemResponse,
  type MealTemplateListResponse,
  type MealTime,
  type UpdateMealTemplateItemRequest,
  type UpdateMealTemplateRequest,
  type UpsertMealTemplateDayRequest,
} from '@meal/shared';

import { createAuthenticatedApiClient } from '@/services/api/http-client';

import {
  createTemplateDay,
  type TemplateDayState,
} from '../utils/template-screen-data';
import {
  formatMenuApiDate,
} from '@features/menu/utils/menu-flow';
import {
  formatMenuNutritionValue,
  type MenuMealItem,
  type MenuNutrition,
} from '@features/menu/utils/menu-meal-times';

const TemplateIdSchema = z.string().uuid();
const TemplateDayNumberSchema = z.number().int().positive();

export type PublicTemplateApiConfig = {
  apiBaseUrl?: string;
};

export type AuthenticatedTemplateApiConfig = PublicTemplateApiConfig & {
  accessToken: string;
};

export type TemplateListItemScreenData = {
  dayCount: number;
  description: string;
  nutritionSummary: string;
  nutritionTotal: MenuNutrition;
  templateCardImageUrl: string | null;
  templateId: string;
  title: string;
};

export type TemplateDetailScreenData = {
  days: TemplateDayState[];
  description: string;
  nutritionTotal: MenuNutrition;
  templateDetailImageUrl: string | null;
  templateId: string;
  title: string;
};

export type TemplateEditorData = {
  initialDays: TemplateDayState[];
  initialDescription: string;
  initialTemplateImageKey: string | null;
  initialTemplateImageUrl: string | null;
  initialTemplateName: string;
  nutritionTotal: MenuNutrition;
  templateId: string;
};

export type TemplateMetadataInput = {
  description?: string | null;
  name: string;
};

export type TemplateApplySelectionInput = {
  replaceExistingMeals: boolean;
  selectedDate: Date;
};

export type TemplateDayMutationInput = Pick<TemplateDayState, 'dayNumber' | 'mealTimeGroups'>;

export type TemplateDayUpsertRequest = {
  dayNumber: number;
  payload: UpsertMealTemplateDayRequest;
};

export type TemplateEditDayPlan = {
  dayNumbersToDelete: number[];
  daysToUpsert: TemplateDayUpsertRequest[];
};

type TemplateEditorMealItem = MenuMealItem & {
  templateItemId?: string;
};

export async function fetchTemplateList(
  config: AuthenticatedTemplateApiConfig,
): Promise<MealTemplateListResponse> {
  const client = createProtectedTemplateApiClient(config);
  const response = await client.get('/v1/meal-templates');

  return parseWithSchema(
    MealTemplateListResponseSchema,
    response.data,
    { userMessage: 'Unable to load templates right now.' },
  );
}

export async function fetchTemplateListScreenData(
  config: AuthenticatedTemplateApiConfig,
): Promise<TemplateListItemScreenData[]> {
  const response = await fetchTemplateList(config);
  return response.list.map(mapTemplateListItemToScreenData);
}

export async function fetchTemplateDetail(
  config: AuthenticatedTemplateApiConfig & {
    templateId: string;
  },
): Promise<MealTemplateDetailResponse> {
  const client = createProtectedTemplateApiClient(config);
  const templateId = parseWithSchema(
    TemplateIdSchema,
    config.templateId,
    {
      userMessage: 'Unable to load template details right now.',
      failureMode: 'request',
    },
  );

  const response = await client.get(`/v1/meal-templates/${templateId}`);

  return parseWithSchema(
    MealTemplateDetailResponseSchema,
    response.data,
    { userMessage: 'Unable to load template details right now.' },
  );
}

export async function fetchTemplateDetailScreenData(
  config: AuthenticatedTemplateApiConfig & {
    templateId: string;
  },
): Promise<TemplateDetailScreenData> {
  const response = await fetchTemplateDetail(config);
  return mapTemplateDetailResponseToScreenData(response);
}

export async function fetchTemplateEditorData(
  config: AuthenticatedTemplateApiConfig & {
    templateId: string;
  },
): Promise<TemplateEditorData> {
  const response = await fetchTemplateDetail(config);
  return mapTemplateDetailResponseToEditorData(response);
}

export async function createTemplate(
  config: AuthenticatedTemplateApiConfig & {
    payload: CreateMealTemplateRequest;
  },
): Promise<{ id: string }> {
  const client = createProtectedTemplateApiClient(config);
  const payload = parseWithSchema(
    CreateMealTemplateRequestSchema,
    config.payload,
    {
      userMessage: 'Unable to create this template right now.',
      failureMode: 'request',
    },
  );

  const response = await client.post('/v1/meal-templates', payload);

  return parseWithSchema(
    z.object({ id: z.string().uuid() }),
    response.data,
    { userMessage: 'Unable to create this template right now.' },
  );
}

export async function updateTemplate(
  config: AuthenticatedTemplateApiConfig & {
    payload: UpdateMealTemplateRequest;
    templateId: string;
  },
): Promise<void> {
  const client = createProtectedTemplateApiClient(config);
  const templateId = parseWithSchema(
    TemplateIdSchema,
    config.templateId,
    {
      userMessage: 'Unable to update this template right now.',
      failureMode: 'request',
    },
  );
  const payload = parseWithSchema(
    UpdateMealTemplateRequestSchema,
    config.payload,
    {
      userMessage: 'Unable to update this template right now.',
      failureMode: 'request',
    },
  );

  await client.patch(`/v1/meal-templates/${templateId}`, payload);
}

export async function deleteTemplate(
  config: AuthenticatedTemplateApiConfig & {
    templateId: string;
  },
): Promise<void> {
  const client = createProtectedTemplateApiClient(config);
  const templateId = parseWithSchema(
    TemplateIdSchema,
    config.templateId,
    {
      userMessage: 'Unable to delete this template right now.',
      failureMode: 'request',
    },
  );

  await client.delete(`/v1/meal-templates/${templateId}`);
}

export async function applyTemplate(
  config: AuthenticatedTemplateApiConfig & {
    payload: ApplyMealTemplateRequest;
    templateId: string;
  },
): Promise<ApplyMealTemplateResponse> {
  const client = createProtectedTemplateApiClient(config);
  const templateId = parseWithSchema(
    TemplateIdSchema,
    config.templateId,
    {
      userMessage: 'Unable to apply this template right now.',
      failureMode: 'request',
    },
  );
  const payload = parseWithSchema(
    ApplyMealTemplateRequestSchema,
    config.payload,
    {
      userMessage: 'Unable to apply this template right now.',
      failureMode: 'request',
    },
  );

  const response = await client.post(`/v1/meal-templates/${templateId}/apply`, payload);

  return parseWithSchema(
    ApplyMealTemplateResponseSchema,
    response.data,
    { userMessage: 'Unable to apply this template right now.' },
  );
}

export async function upsertTemplateDay(
  config: AuthenticatedTemplateApiConfig & {
    dayNumber: number;
    payload: UpsertMealTemplateDayRequest;
    templateId: string;
  },
): Promise<void> {
  const client = createProtectedTemplateApiClient(config);
  const templateId = parseWithSchema(
    TemplateIdSchema,
    config.templateId,
    {
      userMessage: 'Unable to save this template day right now.',
      failureMode: 'request',
    },
  );
  const dayNumber = parseWithSchema(
    TemplateDayNumberSchema,
    config.dayNumber,
    {
      userMessage: 'Unable to save this template day right now.',
      failureMode: 'request',
    },
  );
  const payload = parseWithSchema(
    UpsertMealTemplateDayRequestSchema,
    config.payload,
    {
      userMessage: 'Unable to save this template day right now.',
      failureMode: 'request',
    },
  );

  await client.put(`/v1/meal-templates/${templateId}/days/${dayNumber}`, payload);
}

export async function deleteTemplateDay(
  config: AuthenticatedTemplateApiConfig & {
    dayNumber: number;
    templateId: string;
  },
): Promise<void> {
  const client = createProtectedTemplateApiClient(config);
  const templateId = parseWithSchema(
    TemplateIdSchema,
    config.templateId,
    {
      userMessage: 'Unable to delete this template day right now.',
      failureMode: 'request',
    },
  );
  const dayNumber = parseWithSchema(
    TemplateDayNumberSchema,
    config.dayNumber,
    {
      userMessage: 'Unable to delete this template day right now.',
      failureMode: 'request',
    },
  );

  await client.delete(`/v1/meal-templates/${templateId}/days/${dayNumber}`);
}

export async function addTemplateItem(
  config: AuthenticatedTemplateApiConfig & {
    payload: AddMealTemplateItemRequest;
    templateId: string;
  },
): Promise<MealTemplateItemResponse> {
  const client = createProtectedTemplateApiClient(config);
  const templateId = parseWithSchema(
    TemplateIdSchema,
    config.templateId,
    {
      userMessage: 'Unable to add this meal to the template right now.',
      failureMode: 'request',
    },
  );
  const payload = parseWithSchema(
    AddMealTemplateItemRequestSchema,
    config.payload,
    {
      userMessage: 'Unable to add this meal to the template right now.',
      failureMode: 'request',
    },
  );

  const response = await client.post(`/v1/meal-templates/${templateId}/items`, payload);

  return parseWithSchema(
    MealTemplateItemResponseSchema,
    response.data,
    { userMessage: 'Unable to add this meal to the template right now.' },
  );
}

export async function updateTemplateItem(
  config: AuthenticatedTemplateApiConfig & {
    itemId: string;
    payload: UpdateMealTemplateItemRequest;
    templateId: string;
  },
): Promise<MealTemplateItemResponse> {
  const client = createProtectedTemplateApiClient(config);
  const templateId = parseWithSchema(
    TemplateIdSchema,
    config.templateId,
    {
      userMessage: 'Unable to update this template item right now.',
      failureMode: 'request',
    },
  );
  const itemId = parseWithSchema(
    TemplateIdSchema,
    config.itemId,
    {
      userMessage: 'Unable to update this template item right now.',
      failureMode: 'request',
    },
  );
  const payload = parseWithSchema(
    UpdateMealTemplateItemRequestSchema,
    config.payload,
    {
      userMessage: 'Unable to update this template item right now.',
      failureMode: 'request',
    },
  );

  const response = await client.patch(`/v1/meal-templates/${templateId}/items/${itemId}`, payload);

  return parseWithSchema(
    MealTemplateItemResponseSchema,
    response.data,
    { userMessage: 'Unable to update this template item right now.' },
  );
}

export async function deleteTemplateItem(
  config: AuthenticatedTemplateApiConfig & {
    itemId: string;
    templateId: string;
  },
): Promise<void> {
  const client = createProtectedTemplateApiClient(config);
  const templateId = parseWithSchema(
    TemplateIdSchema,
    config.templateId,
    {
      userMessage: 'Unable to delete this template item right now.',
      failureMode: 'request',
    },
  );
  const itemId = parseWithSchema(
    TemplateIdSchema,
    config.itemId,
    {
      userMessage: 'Unable to delete this template item right now.',
      failureMode: 'request',
    },
  );

  await client.delete(`/v1/meal-templates/${templateId}/items/${itemId}`);
}

export function mapTemplateListItemToScreenData(
  template: MealTemplateListItemResponse,
): TemplateListItemScreenData {
  const nutritionTotal = mapTemplateNutrition(template.nutritionTotal);

  return {
    dayCount: template.dayCount,
    description: normalizeOptionalText(template.description),
    nutritionSummary: formatTemplateNutritionSummary(nutritionTotal),
    nutritionTotal,
    templateCardImageUrl: template.templateImageUrls?.card ?? null,
    templateId: template.id,
    title: template.name,
  };
}

export function mapTemplateDetailResponseToScreenData(
  response: MealTemplateDetailResponse,
): TemplateDetailScreenData {
  return {
    days: mapTemplateDetailDaysToState(response.days),
    description: normalizeOptionalText(response.description),
    nutritionTotal: mapTemplateNutrition(response.nutritionTotal),
    templateDetailImageUrl: response.templateImageUrls?.detail ?? null,
    templateId: response.id,
    title: response.name,
  };
}

export function mapTemplateDetailResponseToEditorData(
  response: MealTemplateDetailResponse,
): TemplateEditorData {
  return {
    initialDays: mapTemplateDetailDaysToState(response.days),
    initialDescription: normalizeOptionalText(response.description),
    initialTemplateImageKey: response.templateImageKey,
    initialTemplateImageUrl: response.templateImageUrls?.detail ?? null,
    initialTemplateName: response.name,
    nutritionTotal: mapTemplateNutrition(response.nutritionTotal),
    templateId: response.id,
  };
}

export function mapTemplateDayStateToUpsertPayload(
  day: TemplateDayMutationInput,
): UpsertMealTemplateDayRequest {
  return {
    meals: {
      BREAKFAST: mapTemplateItemsToDayPayload(day.mealTimeGroups, 'BREAKFAST'),
      LUNCH: mapTemplateItemsToDayPayload(day.mealTimeGroups, 'LUNCH'),
      DINNER: mapTemplateItemsToDayPayload(day.mealTimeGroups, 'DINNER'),
    },
  };
}

export function mapTemplateDaysToUpsertRequests(
  days: readonly TemplateDayMutationInput[],
): TemplateDayUpsertRequest[] {
  return days.map((day) => ({
    dayNumber: day.dayNumber,
    payload: mapTemplateDayStateToUpsertPayload(day),
  }));
}

export function buildTemplateEditDayPlan(config: {
  currentDays: readonly TemplateDayMutationInput[];
  initialDays: readonly Pick<TemplateDayState, 'dayNumber'>[];
}): TemplateEditDayPlan {
  const dayNumbersToKeep = new Set(config.currentDays.map((day) => day.dayNumber));

  return {
    dayNumbersToDelete: config.initialDays
      .map((day) => day.dayNumber)
      .filter((dayNumber) => !dayNumbersToKeep.has(dayNumber))
      .sort((left, right) => right - left),
    daysToUpsert: mapTemplateDaysToUpsertRequests(config.currentDays),
  };
}

export function buildCreateTemplatePayload(
  input: TemplateMetadataInput,
): CreateMealTemplateRequest {
  return parseWithSchema(
    CreateMealTemplateRequestSchema,
    {
      name: input.name.trim(),
      description: normalizeOptionalDescription(input.description),
    },
    {
      userMessage: 'Unable to create this template right now.',
      failureMode: 'request',
    },
  );
}

export function buildUpdateTemplatePayload(
  input: TemplateMetadataInput,
): UpdateMealTemplateRequest {
  return parseWithSchema(
    UpdateMealTemplateRequestSchema,
    {
      name: input.name.trim(),
      description: normalizeOptionalDescription(input.description),
    },
    {
      userMessage: 'Unable to update this template right now.',
      failureMode: 'request',
    },
  );
}

export function buildApplyTemplatePayload(
  input: TemplateApplySelectionInput,
): ApplyMealTemplateRequest {
  return parseWithSchema(
    ApplyMealTemplateRequestSchema,
    {
      startDate: formatMenuApiDate(input.selectedDate),
      replaceExistingMeals: input.replaceExistingMeals,
    },
    {
      userMessage: 'Unable to apply this template right now.',
      failureMode: 'request',
    },
  );
}

export function buildAddTemplateItemPayload(input: {
  dayNumber: number;
  mealId: number;
  mealTime: MealTime;
  portionSize: number;
}): AddMealTemplateItemRequest {
  return parseWithSchema(
    AddMealTemplateItemRequestSchema,
    input,
    {
      userMessage: 'Unable to add this meal to the template right now.',
      failureMode: 'request',
    },
  );
}

export function buildUpdateTemplateItemPayload(input: {
  portionSize: number;
}): UpdateMealTemplateItemRequest {
  return parseWithSchema(
    UpdateMealTemplateItemRequestSchema,
    input,
    {
      userMessage: 'Unable to update this template item right now.',
      failureMode: 'request',
    },
  );
}

function mapTemplateDetailDaysToState(
  days: MealTemplateDetailResponse['days'],
): TemplateDayState[] {
  let localMenuItemId = 1;

  return days.map((day) =>
    createTemplateDay({
      dayNumber: day.dayNumber,
      mealsByTime: {
        BREAKFAST: day.meals.BREAKFAST.map((item) =>
          mapTemplateItemResponseToEditorItem(item, {
            dayNumber: day.dayNumber,
            localMenuItemId: localMenuItemId++,
            mealTime: 'BREAKFAST',
          }),
        ),
        LUNCH: day.meals.LUNCH.map((item) =>
          mapTemplateItemResponseToEditorItem(item, {
            dayNumber: day.dayNumber,
            localMenuItemId: localMenuItemId++,
            mealTime: 'LUNCH',
          }),
        ),
        DINNER: day.meals.DINNER.map((item) =>
          mapTemplateItemResponseToEditorItem(item, {
            dayNumber: day.dayNumber,
            localMenuItemId: localMenuItemId++,
            mealTime: 'DINNER',
          }),
        ),
      },
    }),
  );
}

function mapTemplateItemResponseToEditorItem(
  item: MealTemplateItemResponse,
  context: {
    dayNumber: number;
    localMenuItemId: number;
    mealTime: MealTime;
  },
): TemplateEditorMealItem {
  return {
    menuItemId: context.localMenuItemId,
    mealId: item.mealId,
    mealName: item.mealName,
    date: `Day ${context.dayNumber}`,
    mealTime: context.mealTime,
    portionSize: item.portionSize,
    eated: false,
    nutritionPerServing: mapTemplateNutrition(item.nutritionPerServing),
    templateItemId: item.itemId,
  };
}

function mapTemplateItemsToDayPayload(
  groups: TemplateDayState['mealTimeGroups'],
  mealTime: MealTime,
) {
  const group = groups.find((item) => item.mealTime === mealTime);

  return group?.items.map((item) => ({
    mealId: item.mealId,
    portionSize: item.portionSize,
  })) ?? [];
}

function mapTemplateNutrition(nutrition: {
  calories: number;
  protein: number;
  fiber: number;
  fat: number;
}): MenuNutrition {
  return {
    calories: nutrition.calories,
    protein: nutrition.protein,
    fiber: nutrition.fiber,
    fat: nutrition.fat,
  };
}

function formatTemplateNutritionSummary(nutrition: MenuNutrition) {
  return `${formatMenuNutritionValue(nutrition.calories)} kcal | ${formatMenuNutritionValue(nutrition.protein)}g P | ${formatMenuNutritionValue(nutrition.fiber)}g Fib | ${formatMenuNutritionValue(nutrition.fat)}g F`;
}

function normalizeOptionalDescription(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeOptionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : '';
}

function createProtectedTemplateApiClient(config: AuthenticatedTemplateApiConfig) {
  return createAuthenticatedApiClient({
    apiBaseUrl: config.apiBaseUrl,
    accessToken: config.accessToken,
  });
}

function parseWithSchema<T>(
  schema: z.ZodType<T>,
  payload: unknown,
  config: {
    userMessage: string;
    failureMode?: 'request' | 'response';
  },
): T {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(config.userMessage);
  }

  return parsed.data;
}