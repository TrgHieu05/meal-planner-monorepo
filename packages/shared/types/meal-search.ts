import { z } from 'zod';
import { IntSchema } from './common';

export const DifficultyFilterSchema = z.enum(['easy', 'medium', 'hard']);
export type DifficultyFilter = z.infer<typeof DifficultyFilterSchema>;

export const MealSearchQuerySchema = z.object({
  q: z.string().optional().default(''),
  difficulty: DifficultyFilterSchema.optional(),
  allergies: z.string().optional(),
  cookTimeMin: z.coerce.number().int().min(2).max(120).optional(),
  cookTimeMax: z.coerce.number().int().min(2).max(120).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(10),
}).refine(
  (value) =>
    value.cookTimeMin == null ||
    value.cookTimeMax == null ||
    value.cookTimeMin <= value.cookTimeMax,
  {
    message: 'cookTimeMin must be less than or equal to cookTimeMax',
    path: ['cookTimeMin'],
  },
);

export type MealSearchQuery = z.infer<typeof MealSearchQuerySchema>;

export const MealSearchResultItemSchema = z.object({
  id: IntSchema,
  name: z.string(),
  meal_image_key: z.string().nullable(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  cook_time_min: IntSchema,
  total_calories: z.number().nonnegative(),
  total_protein: z.number().nonnegative(),
  total_fat: z.number().nonnegative(),
  total_fiber: z.number().nonnegative(),
  score: z.number().nonnegative(),
});

export type MealSearchResultItem = z.infer<typeof MealSearchResultItemSchema>;

export const MealSearchResponseSchema = z.object({
  list: z.array(MealSearchResultItemSchema),
  page: IntSchema,
  pageSize: IntSchema,
  total: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export type MealSearchResponse = z.infer<typeof MealSearchResponseSchema>;
