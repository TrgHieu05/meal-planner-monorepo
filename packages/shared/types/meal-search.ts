import { z } from 'zod';
import { IntSchema } from './common';

export const DifficultyFilterSchema = z.enum(['easy', 'medium', 'hard']);
export type DifficultyFilter = z.infer<typeof DifficultyFilterSchema>;

export const CookingTimeSchema = z.enum(['<30m', '<45m', '<1hour']);
export type CookingTime = z.infer<typeof CookingTimeSchema>;

export const MealSearchQuerySchema = z.object({
  q: z.string().min(1),
  difficulty: DifficultyFilterSchema.optional(),
  cookingTime: CookingTimeSchema.optional(),
  allergies: z.string().optional(),
});

export type MealSearchQuery = z.infer<typeof MealSearchQuerySchema>;

export const MealSearchResultItemSchema = z.object({
  id: IntSchema,
  name: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  cook_time_min: IntSchema,
  score: z.number().nonnegative(),
});

export type MealSearchResultItem = z.infer<typeof MealSearchResultItemSchema>;

export const MealSearchResponseSchema = z.object({
  list: z.array(MealSearchResultItemSchema),
});

export type MealSearchResponse = z.infer<typeof MealSearchResponseSchema>;
