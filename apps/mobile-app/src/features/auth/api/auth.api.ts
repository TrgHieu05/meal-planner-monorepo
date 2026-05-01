import axios from 'axios';
import { z } from 'zod';

import { resolveApiBaseUrl } from '@/services/api/api-config';

import type { AuthSession, AuthUser } from '../types';

const AUTH_USER_SCHEMA = z.object({
  id: z.string().min(1),
  email: z.email(),
  userName: z.string().min(1),
});

const AUTH_SESSION_SCHEMA = z.object({
  accessToken: z.string().min(1),
  user: AUTH_USER_SCHEMA,
});

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
  const response = await axios.get(
    `${resolveApiBaseUrl(config.apiBaseUrl)}/auth/profile`,
    {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
      timeout: 10000,
    },
  );

  const parsed = AUTH_USER_SCHEMA.safeParse(response.data);
  if (!parsed.success) {
    throw new Error('Auth profile response payload is invalid.');
  }

  return parsed.data;
}

export async function exchangeGoogleIdToken(
  config: GoogleIdTokenExchangeConfig,
): Promise<AuthSession> {
  const response = await axios.post(
    `${resolveApiBaseUrl(config.apiBaseUrl)}/auth/google/exchange`,
    {
      idToken: config.idToken,
    },
    {
      timeout: 10000,
    },
  );

  const parsed = AUTH_SESSION_SCHEMA.safeParse(response.data);
  if (!parsed.success) {
    throw new Error('Google sign-in response payload is invalid.');
  }

  return parsed.data;
}