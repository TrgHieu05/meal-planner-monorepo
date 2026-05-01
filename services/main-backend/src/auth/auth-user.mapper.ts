import { InternalServerErrorException } from '@nestjs/common';
import {
  AuthUser,
  AuthUserSchema,
  GoogleIdTokenExchangeResponse,
  GoogleIdTokenExchangeResponseSchema,
} from '@meal/shared/types/auth';

type AuthUserSource = {
  id: string;
  email: string;
  userName: string;
  gender?: string | null;
  dateOfBirth?: Date | null;
  profile?: { userId: string } | null;
};

export function toAuthUser(source: AuthUserSource): AuthUser {
  const parsed = AuthUserSchema.safeParse({
    id: source.id,
    email: source.email,
    userName: source.userName,
    isOnboardingCompleted: hasCompletedOnboarding(source),
  });

  if (!parsed.success) {
    throw new InternalServerErrorException('Failed to map auth user data.');
  }

  return parsed.data;
}

export function toGoogleIdTokenExchangeResponse(payload: {
  message: string;
  user: AuthUserSource;
  accessToken: string;
}): GoogleIdTokenExchangeResponse {
  const parsed = GoogleIdTokenExchangeResponseSchema.safeParse({
    message: payload.message,
    user: toAuthUser(payload.user),
    accessToken: payload.accessToken,
  });

  if (!parsed.success) {
    throw new InternalServerErrorException(
      'Failed to map Google sign-in response data.',
    );
  }

  return parsed.data;
}

function hasCompletedOnboarding(source: AuthUserSource) {
  return Boolean(source.gender && source.dateOfBirth && source.profile);
}