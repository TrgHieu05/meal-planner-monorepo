import { Platform } from 'react-native';

const DEFAULT_API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';

export function normalizeOptionalString(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function resolveApiBaseUrl(explicitBaseUrl?: string) {
  return (
    normalizeOptionalString(explicitBaseUrl) ??
    normalizeOptionalString(process.env.EXPO_PUBLIC_API_BASE_URL) ??
    DEFAULT_API_BASE_URL
  );
}