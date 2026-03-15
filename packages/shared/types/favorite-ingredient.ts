import { z } from 'zod';
import { IngredientSchema } from './ingredient';
import { IntSchema, UuidSchema } from './common';

export const FavoriteIngredientSchema = z.object({
  userId: UuidSchema,
  ingredientId: IntSchema,
});

export const FavoriteIngredientCreateSchema = z.object({
  ingredientIds: z.array(IntSchema),
});

export const FavoriteIngredientResponseSchema = z.object({
  list: z.array(IngredientSchema),
});

export type FavoriteIngredient = z.infer<typeof FavoriteIngredientSchema>;
export type FavoriteIngredientCreate = z.infer<typeof FavoriteIngredientCreateSchema>;
export type FavoriteIngredientResponse = z.infer<typeof FavoriteIngredientResponseSchema>;