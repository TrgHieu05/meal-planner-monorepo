import { z } from 'zod';
import { UuidSchema } from './common';

<<<<<<< HEAD
export const GenderSchema = z.enum(['M', 'F', 'U']);
=======
export const GenderSchema = z.enum(['M', 'F']);
>>>>>>> e982cb573a5011b40e1a20685c697c440b658343
export const UserSchema = z.object({
  id: UuidSchema,
  email: z.email(),
  userName: z.string(),
  gender: GenderSchema,
  dateOfBirth: z.date().nullable(),
});

export const UserCreateSchema = z.object({
  email: z.email(),
  userName: z.string(),
  gender: GenderSchema,
  dateOfBirth: z.date().nullable().optional(),
});

export const UserUpdateSchema = z.object({
  userName: z.string().optional(),
  gender: GenderSchema.optional(),
  dateOfBirth: z.date().nullable().optional(),
});

export const UserResponseSchema = z.object({
  email: z.email(),
  userName: z.string(),
  gender: GenderSchema,
  dateOfBirth: z.date().nullable(),
});

export type User = z.infer<typeof UserSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;


