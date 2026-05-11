import { describe, expect, it } from '@jest/globals';

import { buildTemplateApplySuccessMessage } from './template-success-alert';

describe('template-success-alert helpers', () => {
  it('builds an apply success message with date range and replace-existing note', () => {
    expect(
      buildTemplateApplySuccessMessage({
        templateId: '550e8400-e29b-41d4-a716-446655440001',
        startDate: '2026-05-10',
        endDate: '2026-05-12',
        appliedDayCount: 3,
        replaceExistingMeals: true,
        createdMenuCount: 2,
        updatedMenuCount: 1,
        deletedMenuCount: 0,
        createdItemCount: 9,
        skippedExistingItemCount: 0,
      }),
    ).toBe('Applied template to 3 days (10.05.2026 - 12.05.2026). Existing meals were replaced where needed.');
  });

  it('mentions skipped conflicts when apply keeps existing meals', () => {
    expect(
      buildTemplateApplySuccessMessage({
        templateId: '550e8400-e29b-41d4-a716-446655440001',
        startDate: '2026-05-10',
        endDate: '2026-05-10',
        appliedDayCount: 1,
        replaceExistingMeals: false,
        createdMenuCount: 1,
        updatedMenuCount: 0,
        deletedMenuCount: 0,
        createdItemCount: 2,
        skippedExistingItemCount: 1,
      }),
    ).toBe('Applied template to 1 day (10.05.2026). Skipped 1 conflicting meal slot.');
  });
});