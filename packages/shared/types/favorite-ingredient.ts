import { z } from 'zod';
import { IngredientSchema } from './ingredient';
import { IntSchema, UuidSchema } from './common';

export const FavoriteIngredientSchema = z.object({
  userId: UuidSchema,
  ingredientId: IntSchema,
  createdAt: z.date(),
});

export const FavoriteIngredientUpdateSchema = z.object({
  ingredientIds: z.array(IntSchema),
});

export const FavoriteIngredientResponseSchema = z.object({
  list: z.array(IngredientSchema.pick({ name: true })),
});

export const FavoriteIngredientIdsResponseSchema = z.object({
  ingredientIds: z.array(IntSchema),
});

export type FavoriteIngredient = z.infer<typeof FavoriteIngredientSchema>;
export type FavoriteIngredientUpdate = z.infer<typeof FavoriteIngredientUpdateSchema>;
export type FavoriteIngredientResponse = z.infer<typeof FavoriteIngredientResponseSchema>;
export type FavoriteIngredientIdsResponse = z.infer<typeof FavoriteIngredientIdsResponseSchema>;
