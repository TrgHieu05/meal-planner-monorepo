import { z } from 'zod';

const ActivityLevelSchema = z.enum(['HIGH', 'AVERAGE', 'LOW']);
import { IntSchema, UuidSchema } from './common';
import { UserResponseSchema } from './user';
import { MetricResponseSchema } from './metric';
import { FavoriteIngredientResponseSchema } from './favorite-ingredient';
import { AllergyResponseSchema } from './allergy';

export const ProfileSchema = z.object({
  id: UuidSchema,
  userId: UuidSchema,
  dietTypeId: IntSchema,
  goalId: IntSchema,
  cuisineTypeId: IntSchema,
  targetCalories: z.number().positive().nullable().optional(),
  activityLevel: ActivityLevelSchema.nullable().optional(),
});

export const ProfileCreateSchema = z.object({
  dietTypeId: IntSchema,
  goalId: IntSchema,
  cuisineTypeId: IntSchema,
  targetCalories: z.number().positive().nullable().optional(),
  activityLevel: ActivityLevelSchema.nullable().optional(),
});

export const ProfileUpdateSchema = z.object({
  dietTypeId: IntSchema.optional(),
  goalId: IntSchema.optional(),
  cuisineTypeId: IntSchema.optional(),
  targetCalories: z.number().positive().nullable().optional(),
  activityLevel: ActivityLevelSchema.nullable().optional(),
});

export const ProfileResponseSchema = ProfileSchema.omit({
  id: true,
  userId: true,
});

export const ProfileOverviewResponseSchema = z.object({
  basic: UserResponseSchema,
  preferences: ProfileResponseSchema.nullable(),
  latestMetric: MetricResponseSchema.nullable(),
  allergies: AllergyResponseSchema,
  favoriteIngredients: FavoriteIngredientResponseSchema,
});

export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileCreate = z.infer<typeof ProfileCreateSchema>;
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;
export type ProfileOverview = z.infer<typeof ProfileOverviewResponseSchema>;
