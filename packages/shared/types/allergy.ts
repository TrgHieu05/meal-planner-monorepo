import { z } from 'zod';
import { IngredientSchema } from './ingredient';
import { IntSchema, UuidSchema } from './common';

export const AllergySchema = z.object({
  userId: UuidSchema,
  ingredientId: IntSchema,
});

export const AllergyCreateSchema = z.object({
  ingredientIds: z.array(IntSchema),
});

export const AllergyResponseSchema = z.object({
  list: z.array(IngredientSchema),
});

export type Allergy = z.infer<typeof AllergySchema>;
export type AllergyCreate = z.infer<typeof AllergyCreateSchema>;
export type AllergyResponse = z.infer<typeof AllergyResponseSchema>;
