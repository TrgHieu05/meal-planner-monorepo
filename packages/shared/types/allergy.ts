import { z } from 'zod';
import { IngredientSchema } from './ingredient';
import { IntSchema, UuidSchema } from './common';

export const AllergySchema = z.object({
  userId: UuidSchema,
  ingredientId: IntSchema,
  createdAt: z.date(),
});

export const AllergyUpdateSchema = z.object({
  ingredientIds: z.array(IntSchema),
});

export const AllergyResponseSchema = z.object({
  list: z.array(IngredientSchema.pick({ id: true, name: true })),
});

export const AllergyIdsResponseSchema = z.object({
  ingredientIds: z.array(IntSchema),
});

export type Allergy = z.infer<typeof AllergySchema>;
export type AllergyUpdate = z.infer<typeof AllergyUpdateSchema>;
export type AllergyResponse = z.infer<typeof AllergyResponseSchema>;
export type AllergyIdsResponse = z.infer<typeof AllergyIdsResponseSchema>;
