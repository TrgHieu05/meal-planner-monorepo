import { z } from 'zod';

const ActivityLevelSchema = z.enum(['HIGH', 'AVERAGE', 'LOW']);
import { IntSchema, UuidSchema } from './common';
import { UserSchema } from './user';
import { MetricOverviewSchema } from './metric';
import { FavoriteIngredientIdsResponseSchema } from './favorite-ingredient';
import { AllergyIdsResponseSchema } from './allergy';

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

export const ProfilePreferencesSchema = z.object({
  dietTypeId: IntSchema,
  goalId: IntSchema,
  cuisineTypeId: IntSchema,
  targetCalories: z.number().positive().nullable().optional(),
  activityLevel: ActivityLevelSchema.nullable().optional(),
});

export const ProfileResponseSchema = z.object({
  profile: ProfileSchema,
});

export const ProfileOverviewSchema = z.object({
  basic: UserSchema,
  preferences: ProfilePreferencesSchema.nullable(),
  latestMetric: MetricOverviewSchema.nullable(),
  allergies: AllergyIdsResponseSchema,
  favoriteIngredients: FavoriteIngredientIdsResponseSchema,
});


export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileCreate = z.infer<typeof ProfileCreateSchema>;
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
export type ProfilePreferences = z.infer<typeof ProfilePreferencesSchema>;
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;
export type ProfileOverview = z.infer<typeof ProfileOverviewSchema>;
