import { useCallback, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import {
  normalizeOptionalString,
  resolveExpoExtraString,
} from '@/config/runtime-config';

const GOOGLE_SIGN_IN_ERRORS = {
  unsupportedPlatform:
    'Google Sign-In native hiện chỉ được cấu hình cho Android development build.',
  missingClientId:
    'Thiếu cấu hình Google Web client ID. Hãy kiểm tra EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID trong environment hiện tại (local, preview hoặc production) rồi rebuild app.',
  requestNotReady:
    'Google Sign-In chưa được cấu hình đúng. Hãy restart app sau khi rebuild development build.',
  cancelled: 'Bạn đã hủy đăng nhập Google.',
  inProgress: 'Google Sign-In đang chạy. Hãy đợi thao tác hiện tại hoàn tất.',
  playServicesUnavailable:
    'Thiết bị Android này chưa có Google Play Services khả dụng.',
  missingIdToken:
    'Google không trả về ID token hợp lệ. Hãy kiểm tra lại Google Web client ID.',
} as const;

let configuredWebClientId: string | null = null;

export function bootstrapGoogleSignIn() {
  if (Platform.OS !== 'android') {
    return;
  }

  const webClientId = resolveGoogleWebClientId();
  if (!webClientId || configuredWebClientId === webClientId) {
    return;
  }

  GoogleSignin.configure({
    webClientId,
    scopes: ['email', 'profile'],
  });
  configuredWebClientId = webClientId;
}

export function useGoogleIdTokenSignIn() {
  const [error, setError] = useState<string | null>(null);

  const isAndroid = Platform.OS === 'android';
  const webClientId = useMemo(() => resolveGoogleWebClientId(), []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const signInForIdToken = useCallback(async () => {
    if (!isAndroid) {
      const nextError = GOOGLE_SIGN_IN_ERRORS.unsupportedPlatform;
      setError(nextError);
      throw new Error(nextError);
    }

    if (!webClientId) {
      const nextError = GOOGLE_SIGN_IN_ERRORS.missingClientId;
      setError(nextError);
      throw new Error(nextError);
    }

    setError(null);

    try {
      bootstrapGoogleSignIn();

      if (configuredWebClientId !== webClientId) {
        throw new Error(GOOGLE_SIGN_IN_ERRORS.requestNotReady);
      }

      const hasPlayServices = await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      if (!hasPlayServices) {
        throw new Error(GOOGLE_SIGN_IN_ERRORS.playServicesUnavailable);
      }

      // Reset the SDK session so Android shows the account chooser instead of
      // silently reusing the previously selected Google account.
      if (GoogleSignin.hasPreviousSignIn() || GoogleSignin.getCurrentUser()) {
        await GoogleSignin.signOut();
      }

      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) {
        throw new Error(GOOGLE_SIGN_IN_ERRORS.cancelled);
      }

      const responseIdToken = response.data.idToken?.trim();
      if (responseIdToken) {
        return responseIdToken;
      }

      const tokens = await GoogleSignin.getTokens();
      const fallbackIdToken = tokens.idToken?.trim();
      if (fallbackIdToken) {
        return fallbackIdToken;
      }

      throw new Error(GOOGLE_SIGN_IN_ERRORS.missingIdToken);
    } catch (caughtError) {
      const nextError = getGoogleSignInErrorMessage(caughtError);
      setError(nextError);
      throw new Error(nextError);
    }
  }, [isAndroid, webClientId]);

  return {
    clearError,
    error,
    isReady: isAndroid && Boolean(webClientId),
    signInForIdToken,
  };
}

function resolveGoogleWebClientId() {
  return (
    resolveExpoExtraString('googleWebClientId') ??
    normalizeOptionalString(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID)
  );
}

function getGoogleSignInErrorMessage(error: unknown) {
  if (isErrorWithCode(error)) {
    switch (error.code) {
      case statusCodes.SIGN_IN_CANCELLED:
        return GOOGLE_SIGN_IN_ERRORS.cancelled;
      case statusCodes.IN_PROGRESS:
        return GOOGLE_SIGN_IN_ERRORS.inProgress;
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        return GOOGLE_SIGN_IN_ERRORS.playServicesUnavailable;
      default:
        break;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim();
  }

  return GOOGLE_SIGN_IN_ERRORS.requestNotReady;
}