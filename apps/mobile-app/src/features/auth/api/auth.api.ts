import {
  AuthProfileResponseSchema,
  GoogleIdTokenExchangeRequestSchema,
  GoogleIdTokenExchangeResponseSchema,
} from '@meal/shared/types/auth';

import {
  createApiClient,
  createAuthenticatedApiClient,
} from '@/services/api/http-client';

import type { AuthSession, AuthUser } from '../types';

export type AuthApiConfig = {
  accessToken: string;
  apiBaseUrl?: string;
};

export type GoogleIdTokenExchangeConfig = {
  idToken: string;
  apiBaseUrl?: string;
};

export async function fetchAuthProfile(
  config: AuthApiConfig,
): Promise<AuthUser> {
  const client = createAuthenticatedApiClient(config);
  const response = await client.get('/auth/profile');

  const parsed = AuthProfileResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    throw new Error('Auth profile response payload is invalid.');
  }

  return parsed.data;
}

export async function exchangeGoogleIdToken(
  config: GoogleIdTokenExchangeConfig,
): Promise<AuthSession> {
  const client = createApiClient(config);
  const payload = GoogleIdTokenExchangeRequestSchema.parse({
    idToken: config.idToken.trim(),
  });
  const response = await client.post('/auth/google/exchange', payload);

  const parsed = GoogleIdTokenExchangeResponseSchema.safeParse(response.data);
  if (!parsed.success) {
    throw new Error('Google sign-in response payload is invalid.');
  }

  return {
    accessToken: parsed.data.accessToken,
    user: parsed.data.user,
  };
}