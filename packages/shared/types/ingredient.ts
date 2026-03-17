import { z } from 'zod';
import { IntSchema } from './common';

export const IngredientSchema = z.object({
  id: IntSchema,
  name: z.string(),
  calories: z.number(),
  protein: z.number(),
  fat: z.number(),
  fiber: z.number(),
  hasGluten: z.boolean(),
  isVegetarian: z.boolean(),
});

export const IngredientResponseSchema = z.object({
  list: z.array(IngredientSchema),
});

export type Ingredient = z.infer<typeof IngredientSchema>;
export type IngredientResponse = z.infer<typeof IngredientResponseSchema>;