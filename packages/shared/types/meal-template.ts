import { z } from 'zod';
import { IntSchema } from './common';

export const MealTimeSchema = z.enum(['BREAKFAST', 'LUNCH', 'DINNER']);
export type MealTime = z.infer<typeof MealTimeSchema>;

// Core Template Request Schemas
export const CreateMealTemplateRequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});
export type CreateMealTemplateRequest = z.infer<typeof CreateMealTemplateRequestSchema>;

export const UpdateMealTemplateRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
});
export type UpdateMealTemplateRequest = z.infer<typeof UpdateMealTemplateRequestSchema>;

// Item Requests
export const AddMealTemplateItemRequestSchema = z.object({
  dayNumber: z.number().int().positive(),
  mealId: IntSchema,
  mealTime: MealTimeSchema,
  portionSize: z.number().positive(),
});
export type AddMealTemplateItemRequest = z.infer<typeof AddMealTemplateItemRequestSchema>;

export const UpdateMealTemplateItemRequestSchema = z.object({
  portionSize: z.number().positive(),
});
export type UpdateMealTemplateItemRequest = z.infer<typeof UpdateMealTemplateItemRequestSchema>;

// Bulk Upsert Day
export const MealTemplateItemPayloadSchema = z.object({
  mealId: IntSchema,
  portionSize: z.number().positive(),
});
export type MealTemplateItemPayload = z.infer<typeof MealTemplateItemPayloadSchema>;

export const UpsertMealTemplateDayRequestSchema = z.object({
  meals: z.object({
    BREAKFAST: z.array(MealTemplateItemPayloadSchema).optional(),
    LUNCH: z.array(MealTemplateItemPayloadSchema).optional(),
    DINNER: z.array(MealTemplateItemPayloadSchema).optional(),
  }),
});
export type UpsertMealTemplateDayRequest = z.infer<typeof UpsertMealTemplateDayRequestSchema>;

// Responses
export const MealTemplateItemResponseSchema = z.object({
  itemId: z.string().uuid(),
  mealId: IntSchema,
  mealName: z.string(),
  portionSize: z.number().positive(),
});
export type MealTemplateItemResponse = z.infer<typeof MealTemplateItemResponseSchema>;

export const MealTemplateDayResponseSchema = z.object({
  dayNumber: z.number().int().positive(),
  meals: z.object({
    BREAKFAST: z.array(MealTemplateItemResponseSchema),
    LUNCH: z.array(MealTemplateItemResponseSchema),
    DINNER: z.array(MealTemplateItemResponseSchema),
  }),
});
export type MealTemplateDayResponse = z.infer<typeof MealTemplateDayResponseSchema>;

export const MealTemplateDetailResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  days: z.array(MealTemplateDayResponseSchema),
});
export type MealTemplateDetailResponse = z.infer<typeof MealTemplateDetailResponseSchema>;

export const MealTemplateListResponseSchema = z.object({
  list: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      description: z.string().nullable().optional(),
      dayCount: z.number().int().nonnegative(),
    })
  ),
});
export type MealTemplateListResponse = z.infer<typeof MealTemplateListResponseSchema>;
