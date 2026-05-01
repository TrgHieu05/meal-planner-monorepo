import { ApiError } from '@/services/api/http-client';

export const GENDER_OPTIONS = [
  { label: 'Male', value: 'M' },
  { label: 'Female', value: 'F' },
] as const;

export const ACTIVITY_LEVEL_OPTIONS = [
  { label: 'High', value: 'HIGH' },
  { label: 'Average', value: 'AVERAGE' },
  { label: 'Low', value: 'LOW' },
] as const;

export function resolveApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return fallbackMessage;
}

export function extractFieldErrors<TFieldName extends string>(
  error: unknown,
  fieldNames: readonly TFieldName[],
) {
  const messages = getApiMessages(error);
  const fieldErrors = {} as Partial<Record<TFieldName, string>>;

  for (const fieldName of fieldNames) {
    const message = messages.find((item) =>
      item.toLowerCase().includes(fieldName.toLowerCase()),
    );

    if (message) {
      fieldErrors[fieldName] = message;
    }
  }

  return fieldErrors;
}

function getApiMessages(error: unknown) {
  if (!(error instanceof ApiError)) {
    return error instanceof Error && error.message.trim()
      ? [error.message.trim()]
      : [];
  }

  const rawMessages = (error.data as { message?: unknown } | null)?.message;
  if (Array.isArray(rawMessages)) {
    return rawMessages.filter(
      (item): item is string => typeof item === 'string' && item.trim().length > 0,
    );
  }

  return error.message.trim() ? [error.message.trim()] : [];
}