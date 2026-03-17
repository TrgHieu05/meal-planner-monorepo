import { z } from 'zod';

const ActivityLevelSchema = z.enum(['HIGH', 'AVERAGE', 'LOW']);
import { IntSchema, UuidSchema } from './common';

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

export type Profile = z.infer<typeof ProfileSchema>;
export type ProfileCreate = z.infer<typeof ProfileCreateSchema>;
export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>;
