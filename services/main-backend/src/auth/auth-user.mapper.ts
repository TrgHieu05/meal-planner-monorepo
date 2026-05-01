import { InternalServerErrorException, Logger } from '@nestjs/common';
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

const authUserMapperLogger = new Logger('AuthUserMapper');

export function toAuthUser(source: AuthUserSource): AuthUser {
  const normalizedUserName = normalizeAuthUserName(source);
  const parsed = AuthUserSchema.safeParse({
    id: source.id,
    email: source.email,
    userName: normalizedUserName,
    isOnboardingCompleted: hasCompletedOnboarding(source),
  });

  if (!parsed.success) {
    authUserMapperLogger.error(
      `Failed to map auth user ${source.id}: ${parsed.error.issues
        .map((issue) => issue.message)
        .join('; ')}`,
    );
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

function normalizeAuthUserName(source: AuthUserSource) {
  const normalizedUserName = source.userName.trim();
  if (normalizedUserName.length > 0) {
    return normalizedUserName;
  }

  const emailLocalPart = source.email.split('@')[0]?.trim();
  const fallbackUserName =
    emailLocalPart && emailLocalPart.length > 0
      ? emailLocalPart
      : `user-${source.id.slice(0, 8)}`;

  authUserMapperLogger.warn(
    `Recovered empty userName for auth user ${source.id}.`,
  );

  return fallbackUserName;
}