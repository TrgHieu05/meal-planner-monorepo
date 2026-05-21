import { ApiError } from '@/services/api/http-client';

export type FieldErrors<TFieldName extends string> = Partial<
  Record<TFieldName, string>
>;

type GenderCode = 'M' | 'F';
type ActivityLevelCode = 'HIGH' | 'AVERAGE' | 'LOW';

type ApiErrorDetails = {
  formErrors?: unknown;
  fieldErrors?: unknown;
};

const TECHNICAL_ERROR_PATTERNS = [
  /payload is invalid/i,
  /^request body is invalid/i,
  /^response payload is invalid/i,
];

const FIELD_LABELS: Record<string, string> = {
  userName: 'Full name',
  gender: 'Gender',
  dateOfBirth: 'Birth date',
  dietTypeId: 'Diet type',
  goalId: 'Goal',
  cuisineTypeId: 'Cuisine type',
  targetCalories: 'Target calories',
  heightCm: 'Height',
  weightKg: 'Weight',
};

export class FormValidationError<
  TFieldName extends string = string,
> extends Error {
  readonly fieldErrors: FieldErrors<TFieldName>;

  constructor(
    message: string,
    fieldErrors: FieldErrors<TFieldName> = {},
  ) {
    super(message);
    this.name = 'FormValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export const GENDER_OPTIONS = [
  { label: 'Male', value: 'M' },
  { label: 'Female', value: 'F' },
] as const;

export const ACTIVITY_LEVEL_OPTIONS = [
  { label: 'High', value: 'HIGH' },
  { label: 'Average', value: 'AVERAGE' },
  { label: 'Low', value: 'LOW' },
] as const;

export function hasFieldErrors<TFieldName extends string>(
  fieldErrors: FieldErrors<TFieldName>,
) {
  return Object.values(fieldErrors).some(
    (message) => typeof message === 'string' && message.trim().length > 0,
  );
}

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
  const formErrors = getFormErrors(error);
  if (formErrors.length > 0) {
    return formErrors[0];
  }

  if (hasErrorFieldErrors(error)) {
    return fallbackMessage;
  }

  if (error instanceof Error && error.message.trim()) {
    const message = error.message.trim();
    if (!isTechnicalErrorMessage(message)) {
      return message;
    }
  }

  return fallbackMessage;
}

export function extractFieldErrors<TFieldName extends string>(
  error: unknown,
  fieldNames: readonly TFieldName[],
) {
  const messages = getErrorMessages(error);
  const detailFieldErrors = getErrorFieldErrors(error);
  const fieldErrors = {} as FieldErrors<TFieldName>;

  for (const fieldName of fieldNames) {
    const detailMessage = findFieldErrorMessage(detailFieldErrors, fieldName);
    if (detailMessage) {
      fieldErrors[fieldName] = detailMessage;
    }
  }

  for (const fieldName of fieldNames) {
    if (fieldErrors[fieldName]) {
      continue;
    }

    const message = messages.find((item) =>
      item.toLowerCase().includes(fieldName.toLowerCase()),
    );

    if (message) {
      fieldErrors[fieldName] = normalizeFieldErrorMessage(fieldName, message);
    }
  }

  return fieldErrors;
}

export function validateUserInfoForm(input: {
  userName: string;
  dateOfBirth: Date | null;
  gender?: GenderCode | undefined;
}) {
  const fieldErrors = {} as FieldErrors<'userName' | 'dateOfBirth'>;
  const userName = input.userName.trim();

  if (!userName) {
    fieldErrors.userName = 'Full name is required.';
  }

  const dateOfBirthError = getDateOfBirthError(input.dateOfBirth);
  if (dateOfBirthError) {
    fieldErrors.dateOfBirth = dateOfBirthError;
  }

  if (hasFieldErrors(fieldErrors)) {
    throw new FormValidationError(
      'Please review the highlighted fields.',
      fieldErrors,
    );
  }

  return {
    userName,
    gender: input.gender,
    dateOfBirth: input.dateOfBirth,
  };
}

export function validatePreferenceForm(input: {
  dietTypeId?: string;
  goalId?: string;
  cuisineTypeId?: string;
  targetCalories: string;
  activityLevel?: ActivityLevelCode | undefined;
}) {
  const fieldErrors = {} as FieldErrors<
    'dietTypeId' | 'goalId' | 'cuisineTypeId' | 'targetCalories'
  >;

  const dietTypeId = parseRequiredOptionId(
    input.dietTypeId,
    'dietTypeId',
    'Diet type is required.',
    fieldErrors,
  );
  const goalId = parseRequiredOptionId(
    input.goalId,
    'goalId',
    'Goal is required.',
    fieldErrors,
  );
  const cuisineTypeId = parseRequiredOptionId(
    input.cuisineTypeId,
    'cuisineTypeId',
    'Cuisine type is required.',
    fieldErrors,
  );
  const targetCalories = parseOptionalPositiveNumber(
    input.targetCalories,
    'targetCalories',
    'Target calories',
    fieldErrors,
  );

  if (hasFieldErrors(fieldErrors)) {
    throw new FormValidationError(
      'Please review the highlighted fields.',
      fieldErrors,
    );
  }

  return {
    dietTypeId: dietTypeId as number,
    goalId: goalId as number,
    cuisineTypeId: cuisineTypeId as number,
    targetCalories,
    activityLevel: input.activityLevel,
  };
}

export function validateMetricForm(input: {
  heightCm: string;
  weightKg: string;
}) {
  const fieldErrors = {} as FieldErrors<'heightCm' | 'weightKg'>;
  const heightCm = parseRequiredPositiveNumber(
    input.heightCm,
    'heightCm',
    'Height',
    fieldErrors,
  );
  const weightKg = parseRequiredPositiveNumber(
    input.weightKg,
    'weightKg',
    'Weight',
    fieldErrors,
  );

  if (hasFieldErrors(fieldErrors)) {
    throw new FormValidationError(
      'Please review the highlighted fields.',
      fieldErrors,
    );
  }

  return {
    heightCm: heightCm as number,
    weightKg: weightKg as number,
  };
}

export function validateOnboardingInfoStep(input: {
  gender: GenderCode | null;
  dateOfBirth: Date | null;
}) {
  const fieldErrors = {} as FieldErrors<'gender' | 'dateOfBirth'>;

  if (!input.gender) {
    fieldErrors.gender = 'Gender is required.';
  }

  const dateOfBirthError = getDateOfBirthError(input.dateOfBirth);
  if (dateOfBirthError) {
    fieldErrors.dateOfBirth = dateOfBirthError;
  }

  if (hasFieldErrors(fieldErrors)) {
    throw new FormValidationError(
      'Please review the highlighted fields.',
      fieldErrors,
    );
  }

  return {
    gender: input.gender as GenderCode,
    dateOfBirth: input.dateOfBirth as Date,
  };
}

export function validateOnboardingDietTypeStep(input: {
  dietTypeId: number | null;
}) {
  return validateRequiredDraftSelection(
    input.dietTypeId,
    'dietTypeId',
    'Diet type is required.',
  );
}

export function validateOnboardingCuisineTypeStep(input: {
  cuisineTypeId: number | null;
}) {
  return validateRequiredDraftSelection(
    input.cuisineTypeId,
    'cuisineTypeId',
    'Cuisine type is required.',
  );
}

export function validateOnboardingGoalStep(input: {
  goalId: number | null;
  targetCalories: string;
}) {
  const fieldErrors = {} as FieldErrors<'goalId' | 'targetCalories'>;

  if (input.goalId == null || !Number.isInteger(input.goalId) || input.goalId <= 0) {
    fieldErrors.goalId = 'Goal is required.';
  }

  const targetCalories = parseOptionalPositiveNumber(
    input.targetCalories,
    'targetCalories',
    'Target calories',
    fieldErrors,
  );

  if (hasFieldErrors(fieldErrors)) {
    throw new FormValidationError(
      'Please review the highlighted fields.',
      fieldErrors,
    );
  }

  return {
    goalId: input.goalId as number,
    targetCalories,
  };
}

export function validateOnboardingMetricStep(input: {
  heightCm: string;
  weightKg: string;
}) {
  return validateMetricForm(input);
}

function validateRequiredDraftSelection<TFieldName extends string>(
  value: number | null,
  fieldName: TFieldName,
  message: string,
) {
  const fieldErrors = {} as FieldErrors<TFieldName>;

  if (value == null || !Number.isInteger(value) || value <= 0) {
    fieldErrors[fieldName] = message;
    throw new FormValidationError(
      'Please review the highlighted fields.',
      fieldErrors,
    );
  }

  return value;
}

function parseRequiredOptionId<TFieldName extends string>(
  value: string | undefined,
  fieldName: TFieldName,
  requiredMessage: string,
  fieldErrors: FieldErrors<TFieldName>,
) {
  const normalizedValue = value?.trim();
  if (!normalizedValue) {
    fieldErrors[fieldName] = requiredMessage;
    return null;
  }

  const parsedValue = Number.parseInt(normalizedValue, 10);
  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    fieldErrors[fieldName] = `Please select a valid ${FIELD_LABELS[fieldName]?.toLowerCase() ?? fieldName}.`;
    return null;
  }

  return parsedValue;
}

function parseOptionalPositiveNumber<TFieldName extends string>(
  value: string,
  fieldName: TFieldName,
  label: string,
  fieldErrors: FieldErrors<TFieldName>,
) {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    return null;
  }

  return parseRequiredPositiveNumber(value, fieldName, label, fieldErrors);
}

function parseRequiredPositiveNumber<TFieldName extends string>(
  value: string,
  fieldName: TFieldName,
  label: string,
  fieldErrors: FieldErrors<TFieldName>,
) {
  const normalizedValue = value.trim();
  if (!normalizedValue) {
    fieldErrors[fieldName] = `${label} is required.`;
    return null;
  }

  const parsedNumber = Number(normalizedValue);
  if (!Number.isFinite(parsedNumber) || parsedNumber <= 0) {
    fieldErrors[fieldName] = `${label} must be a positive number.`;
    return null;
  }

  return parsedNumber;
}

function getDateOfBirthError(dateOfBirth: Date | null) {
  if (!dateOfBirth) {
    return 'Birth date is required.';
  }

  if (Number.isNaN(dateOfBirth.getTime())) {
    return 'Please select a valid birth date.';
  }

  if (dateOfBirth.getTime() > Date.now()) {
    return 'Birth date cannot be in the future.';
  }

  return null;
}

function getFormErrors(error: unknown) {
  if (error instanceof FormValidationError) {
    if (hasFieldErrors(error.fieldErrors)) {
      return [];
    }

    return error.message.trim() ? [error.message.trim()] : [];
  }

  const details = getApiErrorDetails(error);
  const formErrors = normalizeStringArray(details?.formErrors);
  if (formErrors.length > 0) {
    return formErrors;
  }

  return getErrorMessages(error).filter(
    (message) => !isTechnicalErrorMessage(message),
  );
}

function hasErrorFieldErrors(error: unknown) {
  return hasFieldErrors(getErrorFieldErrors(error));
}

function getErrorMessages(error: unknown) {
  if (error instanceof FormValidationError) {
    return Object.values(error.fieldErrors).filter(
      (message): message is string =>
        typeof message === 'string' && message.trim().length > 0,
    );
  }

  if (!(error instanceof ApiError)) {
    return error instanceof Error && error.message.trim()
      ? [error.message.trim()]
      : [];
  }

  const rawMessages = (error.data as { message?: unknown } | null)?.message;
  if (Array.isArray(rawMessages)) {
    return normalizeStringArray(rawMessages);
  }

  return error.message.trim() ? [error.message.trim()] : [];
}

function getErrorFieldErrors(error: unknown) {
  if (error instanceof FormValidationError) {
    return Object.fromEntries(
      Object.entries(error.fieldErrors)
        .map(([fieldName, value]) => {
          if (typeof value !== 'string' || value.trim().length === 0) {
            return null;
          }

          return [fieldName, normalizeFieldErrorMessage(fieldName, value)]
        })
        .filter((entry): entry is [string, string] => entry != null),
    ) as Record<string, string>;
  }

  const details = getApiErrorDetails(error);
  if (!details || typeof details.fieldErrors !== 'object' || !details.fieldErrors) {
    return {};
  }

  const fieldEntries = Object.entries(
    details.fieldErrors as Record<string, unknown>,
  );

  return Object.fromEntries(
    fieldEntries
      .map(([fieldName, value]) => {
        const [message] = normalizeStringArray(value);
        if (!message) {
          return null;
        }

        return [fieldName, normalizeFieldErrorMessage(fieldName, message)];
      })
      .filter((entry): entry is [string, string] => entry != null),
  );
}

function getApiErrorDetails(error: unknown) {
  if (!(error instanceof ApiError)) {
    return null;
  }

  const details = (error.data as { details?: unknown } | null)?.details;
  if (!details || typeof details !== 'object') {
    return null;
  }

  return details as ApiErrorDetails;
}

function findFieldErrorMessage(
  fieldErrors: Record<string, string>,
  fieldName: string,
) {
  const exactMessage = fieldErrors[fieldName];
  if (exactMessage) {
    return exactMessage;
  }

  const matchedEntry = Object.entries(fieldErrors).find(
    ([candidateFieldName]) =>
      candidateFieldName.toLowerCase() === fieldName.toLowerCase(),
  );

  return matchedEntry?.[1] ?? null;
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return typeof value === 'string' && value.trim().length > 0
      ? [value.trim()]
      : [];
  }

  return value.filter(
    (item): item is string => typeof item === 'string' && item.trim().length > 0,
  );
}

function normalizeFieldErrorMessage(fieldName: string, message: string) {
  const normalizedMessage = message.trim();
  const lowercaseMessage = normalizedMessage.toLowerCase();
  const label = FIELD_LABELS[fieldName] ?? fieldName;

  if (
    lowercaseMessage.includes('must not be empty') ||
    lowercaseMessage.includes('required')
  ) {
    return `${label} is required.`;
  }

  if (
    fieldName === 'dateOfBirth' &&
    (lowercaseMessage.includes('valid calendar date') ||
      lowercaseMessage.includes('yyyy-mm-dd') ||
      lowercaseMessage.includes('valid iso date') ||
      lowercaseMessage.includes('valid date'))
  ) {
    return 'Please select a valid birth date.';
  }

  if (
    ['targetCalories', 'heightCm', 'weightKg'].includes(fieldName) &&
    (lowercaseMessage.includes('positive') ||
      lowercaseMessage.includes('too small') ||
      lowercaseMessage.includes('received nan') ||
      lowercaseMessage.includes('expected number'))
  ) {
    return `${label} must be a positive number.`;
  }

  if (fieldName === 'gender' && lowercaseMessage.includes('invalid')) {
    return 'Please select a valid gender.';
  }

  if (
    ['dietTypeId', 'goalId', 'cuisineTypeId'].includes(fieldName) &&
    lowercaseMessage.includes('invalid')
  ) {
    return `Please select a valid ${label.toLowerCase()}.`;
  }

  return normalizedMessage;
}

function isTechnicalErrorMessage(message: string) {
  return TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}