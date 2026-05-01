import { z } from 'zod';
import { UuidSchema } from './common';

export const GenderSchema = z.enum(['M', 'F']);
export const UserNameSchema = z.string().trim().min(1, {
  message: 'userName must not be empty',
});

export const UserSchema = z.object({
  id: UuidSchema,
  email: z.email(),
  userName: UserNameSchema,
  gender: GenderSchema.nullable(),
  dateOfBirth: z.date().nullable(),
});

export const UserCreateSchema = z.object({
  email: z.email(),
  userName: UserNameSchema,
  gender: GenderSchema.nullable().optional(),
  dateOfBirth: z.date().nullable().optional(),
});

export const UserUpdateSchema = z.object({
  userName: UserNameSchema.optional(),
  gender: GenderSchema.optional(),
  dateOfBirth: z.date().nullable().optional(),
});

export const UserResponseSchema = z.object({
  email: z.email(),
  userName: UserNameSchema,
  gender: GenderSchema.nullable(),
  dateOfBirth: z.date().nullable(),
});

export type User = z.infer<typeof UserSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;


