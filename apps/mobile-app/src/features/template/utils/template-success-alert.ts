import { Alert } from 'react-native';
import type { ApplyMealTemplateResponse } from '@meal/shared';

import { formatMenuFlowDateFromApiDate } from '@features/menu/utils/menu-flow';

export const TEMPLATE_ACTION_SUCCESS_MESSAGES = {
  delete: 'Deleted template successfully',
} as const;

export function buildTemplateApplySuccessMessage(response: ApplyMealTemplateResponse) {
  const formattedStartDate = formatMenuFlowDateFromApiDate(response.startDate);
  const formattedEndDate = formatMenuFlowDateFromApiDate(response.endDate);
  const appliedDayLabel = response.appliedDayCount === 1 ? 'day' : 'days';
  const appliedRange =
    formattedStartDate === formattedEndDate
      ? formattedStartDate
      : `${formattedStartDate} - ${formattedEndDate}`;
  const messageParts = [
    `Applied template to ${response.appliedDayCount} ${appliedDayLabel} (${appliedRange}).`,
  ];

  if (response.replaceExistingMeals) {
    messageParts.push('Existing meals were replaced where needed.');
  } else if (response.skippedExistingItemCount > 0) {
    const skippedLabel = response.skippedExistingItemCount === 1 ? 'meal slot' : 'meal slots';
    messageParts.push(`Skipped ${response.skippedExistingItemCount} conflicting ${skippedLabel}.`);
  }

  return messageParts.join(' ');
}

export function showTemplateSuccessAlert(message: string) {
  Alert.alert('Thành công', message);
}