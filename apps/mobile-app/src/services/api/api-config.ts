import {
  normalizeOptionalString,
  resolveExpoExtraString,
} from '@/config/runtime-config';

const MISSING_API_BASE_URL_ERROR =
  'Thiếu cấu hình EXPO_PUBLIC_API_BASE_URL. Hãy cấu hình apiBaseUrl trong app config hoặc inject EXPO_PUBLIC_API_BASE_URL cho environment hiện tại trước khi chạy app.';

export { normalizeOptionalString } from '@/config/runtime-config';

export function resolveApiBaseUrl(explicitBaseUrl?: string) {
  const resolvedApiBaseUrl =
    normalizeOptionalString(explicitBaseUrl) ??
    resolveExpoExtraString('apiBaseUrl') ??
    normalizeOptionalString(process.env.EXPO_PUBLIC_API_BASE_URL);

  if (!resolvedApiBaseUrl) {
    throw new Error(MISSING_API_BASE_URL_ERROR);
  }

  return resolvedApiBaseUrl;
}