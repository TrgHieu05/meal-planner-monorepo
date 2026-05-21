import type { AuthUser as SharedAuthUser } from '@meal/shared/types/auth';

export type AuthUser = SharedAuthUser;

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};