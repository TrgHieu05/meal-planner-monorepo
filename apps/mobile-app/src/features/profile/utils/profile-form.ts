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

export function resolveGenderLabel(code: string | null | undefined) {
  const normalizedCode =
    typeof code === 'string' && code.trim().length > 0
      ? code.trim().toUpperCase()
      : null;

  if (!normalizedCode) {
    return null;
  }

  return (
    GENDER_OPTIONS.find((option) => option.value === normalizedCode)?.label ??
    normalizedCode
  );
}

export function resolveGenderCode(label: string | null | undefined) {
  const normalizedLabel =
    typeof label === 'string' && label.trim().length > 0
      ? label.trim().toLowerCase()
      : null;

  if (!normalizedLabel) {
    return null;
  }

  return (
    GENDER_OPTIONS.find(
      (option) => option.label.toLowerCase() === normalizedLabel,
    )?.value ?? null
  );
}

export function formatDateOnly(date: Date) {
  if (Number.isNaN(date.getTime())) {
    throw new Error('dateOfBirth must be a valid Date instance.');
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function summarizeConflictIngredientNames(
  items: ReadonlyArray<{ name: string }>,
) {
  if (items.length <= 2) {
    return items.map((item) => item.name);
  }

  return [items[0].name, items[1].name, `+ ${items.length - 2} others`];
}

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