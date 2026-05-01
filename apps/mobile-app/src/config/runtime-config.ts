import Constants from 'expo-constants';

type ExpoRuntimeExtra = {
  apiBaseUrl?: string;
  googleWebClientId?: string;
};

export function normalizeOptionalString(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function resolveExpoExtraString(key: keyof ExpoRuntimeExtra) {
  const extra = Constants.expoConfig?.extra as ExpoRuntimeExtra | undefined;
  const value = extra?.[key];

  if (typeof value !== 'string') {
    return null;
  }

  return normalizeOptionalString(value);
}