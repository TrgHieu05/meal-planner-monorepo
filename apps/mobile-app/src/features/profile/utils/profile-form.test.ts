import { ApiError } from '@/services/api/http-client';

import {
  extractFieldErrors,
  FormValidationError,
  formatDateOnly,
  GENDER_OPTIONS,
  hasFieldErrors,
  resolveApiErrorMessage,
  resolveGenderCode,
  resolveGenderLabel,
  summarizeConflictIngredientNames,
  validateMetricForm,
  validateOnboardingGoalStep,
  validateUserInfoForm,
} from './profile-form';

describe('profile-form utils', () => {
  it('maps backend gender codes to UI labels', () => {
    expect(resolveGenderLabel('M')).toBe('Male');
    expect(resolveGenderLabel('f')).toBe('Female');
    expect(resolveGenderLabel(null)).toBeNull();
  });

  it('maps UI gender labels back to backend codes', () => {
    expect(resolveGenderCode('Male')).toBe('M');
    expect(resolveGenderCode('female')).toBe('F');
    expect(resolveGenderCode('Other')).toBeNull();
    expect(GENDER_OPTIONS).toEqual([
      { label: 'Male', value: 'M' },
      { label: 'Female', value: 'F' },
    ]);
  });

  it('formats dateOfBirth to YYYY-MM-DD', () => {
    expect(formatDateOnly(new Date('2026-05-01T10:20:30.000Z'))).toBe(
      '2026-05-01',
    );
  });

  it('extracts field-level validation errors from API errors', () => {
    const error = new ApiError({
      message: 'Validation failed',
      status: 422,
      data: {
        message: [
          'userName must not be empty',
          'dateOfBirth must be a valid ISO date string',
        ],
      },
    });

    expect(
      extractFieldErrors(error, ['userName', 'dateOfBirth', 'gender'] as const),
    ).toEqual({
      userName: 'Full name is required.',
      dateOfBirth: 'Please select a valid birth date.',
    });
  });

  it('extracts field-level validation errors from API details.fieldErrors', () => {
    const error = new ApiError({
      message: 'Request body is invalid for profile update.',
      status: 422,
      data: {
        message: 'Request body is invalid for profile update.',
        details: {
          formErrors: [],
          fieldErrors: {
            targetCalories: ['Too small: expected number to be >0'],
          },
        },
      },
    });

    expect(extractFieldErrors(error, ['targetCalories'] as const)).toEqual({
      targetCalories: 'Target calories must be a positive number.',
    });
    expect(
      resolveApiErrorMessage(error, 'Please review the highlighted fields.'),
    ).toBe('Please review the highlighted fields.');
  });

  it('keeps frontend validation errors on the field layer', () => {
    const error = new FormValidationError('Please review the highlighted fields.', {
      weightKg: 'Weight must be a positive number.',
    });

    const fieldErrors = extractFieldErrors(error, ['heightCm', 'weightKg'] as const);

    expect(fieldErrors).toEqual({
      weightKg: 'Weight must be a positive number.',
    });
    expect(hasFieldErrors(fieldErrors)).toBe(true);
    expect(
      resolveApiErrorMessage(error, 'Please review the highlighted fields.'),
    ).toBe('Please review the highlighted fields.');
  });

  it('prefers explicit error messages over fallback messages', () => {
    expect(
      resolveApiErrorMessage(new Error('Request failed'), 'Fallback message'),
    ).toBe('Request failed');
  });

  it('validates user info fields before save', () => {
    expect(() =>
      validateUserInfoForm({
        userName: '   ',
        dateOfBirth: new Date('2100-01-01T00:00:00.000Z'),
      }),
    ).toThrow(FormValidationError);
  });

  it('validates target calories as an optional positive number', () => {
    expect(
      validateOnboardingGoalStep({
        goalId: 2,
        targetCalories: '',
      }),
    ).toEqual({
      goalId: 2,
      targetCalories: null,
    });

    expect(() =>
      validateOnboardingGoalStep({
        goalId: 2,
        targetCalories: '0',
      }),
    ).toThrow(FormValidationError);
  });

  it('validates metric fields as required positive numbers', () => {
    expect(
      validateMetricForm({
        heightCm: '170.5',
        weightKg: '62',
      }),
    ).toEqual({
      heightCm: 170.5,
      weightKg: 62,
    });

    expect(() =>
      validateMetricForm({
        heightCm: '',
        weightKg: '-1',
      }),
    ).toThrow(FormValidationError);
  });

  it('summarizes long ingredient conflict lists using + x others', () => {
    expect(
      summarizeConflictIngredientNames([
        { name: 'Milk' },
        { name: 'Egg' },
        { name: 'Peanut' },
        { name: 'Soy' },
      ]),
    ).toEqual(['Milk', 'Egg', '+ 2 others']);
  });
});