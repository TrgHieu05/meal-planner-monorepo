import { z } from 'zod';
import { IntSchema } from './common';
import { CuisineTypeSchema } from './cuisine-type';
import { ImagePublicIdSchema, ImageVariantUrlsSchema } from './image';

export const MealIngredientDetailSchema = z.object({
  id: IntSchema,
  name: z.string(),
  quantity: z.number().positive(),
});

export type MealIngredientDetail = z.infer<typeof MealIngredientDetailSchema>;

export const MealDetailResponseSchema = z.object({
  id: IntSchema,
  name: z.string(),
  meal_image_key: z.string().nullable(),
  meal_image_urls: ImageVariantUrlsSchema.nullable(),
  description: z.string(),
  cuisine_type: CuisineTypeSchema,
  difficulty: z.enum(['easy', 'medium', 'hard']),
  cook_time_min: IntSchema,
  total_calories: z.number().nonnegative(),
  total_protein: z.number().nonnegative(),
  total_fat: z.number().nonnegative(),
  total_fiber: z.number().nonnegative(),
  ingredients: z.array(MealIngredientDetailSchema),
});

export type MealDetailResponse = z.infer<typeof MealDetailResponseSchema>;

export const UpdateMealImageRequestSchema = z.object({
  meal_image_key: ImagePublicIdSchema.nullable(),
});

export type UpdateMealImageRequest = z.infer<typeof UpdateMealImageRequestSchema>;
