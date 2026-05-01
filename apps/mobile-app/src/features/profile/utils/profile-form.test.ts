import { ApiError } from '@/services/api/http-client';

import {
  extractFieldErrors,
  formatDateOnly,
  GENDER_OPTIONS,
  resolveApiErrorMessage,
  resolveGenderCode,
  resolveGenderLabel,
  summarizeConflictIngredientNames,
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
      userName: 'userName must not be empty',
      dateOfBirth: 'dateOfBirth must be a valid ISO date string',
    });
  });

  it('prefers explicit error messages over fallback messages', () => {
    expect(
      resolveApiErrorMessage(new Error('Request failed'), 'Fallback message'),
    ).toBe('Request failed');
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