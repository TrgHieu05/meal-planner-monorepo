import { Platform } from 'react-native';

import {
  normalizeOptionalString,
  resolveExpoExtraString,
} from '@/config/runtime-config';

const DEFAULT_API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';

export { normalizeOptionalString } from '@/config/runtime-config';

export function resolveApiBaseUrl(explicitBaseUrl?: string) {
  return (
    normalizeOptionalString(explicitBaseUrl) ??
    resolveExpoExtraString('apiBaseUrl') ??
    normalizeOptionalString(process.env.EXPO_PUBLIC_API_BASE_URL) ??
    DEFAULT_API_BASE_URL
  );
}