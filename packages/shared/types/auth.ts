import { z } from 'zod';

import { UuidSchema } from './common';

export const AuthUserSchema = z.object({
  id: UuidSchema,
  email: z.email(),
  userName: z.string().min(1),
  isOnboardingCompleted: z.boolean(),
});

export const AuthProfileResponseSchema = AuthUserSchema;

export const GoogleIdTokenExchangeRequestSchema = z.object({
  idToken: z.string().min(1),
});

export const GoogleIdTokenExchangeResponseSchema = z.object({
  message: z.string().min(1),
  user: AuthUserSchema,
  accessToken: z.string().min(1),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;
export type AuthProfileResponse = z.infer<typeof AuthProfileResponseSchema>;
export type GoogleIdTokenExchangeRequest = z.infer<
  typeof GoogleIdTokenExchangeRequestSchema
>;
export type GoogleIdTokenExchangeResponse = z.infer<
  typeof GoogleIdTokenExchangeResponseSchema
>;