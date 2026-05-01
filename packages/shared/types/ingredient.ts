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

export const IngredientSummarySchema = IngredientSchema.pick({
  id: true,
  name: true,
});

export const IngredientCatalogQuerySchema = z.object({
  q: z.string().trim().optional().default(''),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .default(30)
    .refine((value) => value === 30, {
      message: 'pageSize must be 30 for the ingredient catalog endpoint.',
    }),
});

export const IngredientCatalogResponseSchema = z.object({
  items: z.array(IngredientSummarySchema),
  page: IntSchema,
  pageSize: z.literal(30),
  total: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

export const IngredientListConflictResponseSchema = z.object({
  statusCode: z.literal(409),
  message: z.string().min(1),
  code: z.literal('INGREDIENT_LIST_CONFLICT'),
  conflictWith: z.enum(['allergies', 'favoriteIngredients']),
  items: z.array(IngredientSummarySchema),
});

export type Ingredient = z.infer<typeof IngredientSchema>;
export type IngredientSummary = z.infer<typeof IngredientSummarySchema>;
export type IngredientCatalogQuery = z.infer<typeof IngredientCatalogQuerySchema>;
export type IngredientCatalogResponse = z.infer<
  typeof IngredientCatalogResponseSchema
>;
export type IngredientListConflictResponse = z.infer<
  typeof IngredientListConflictResponseSchema
>;