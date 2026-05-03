import type { DatePickerWeekValue } from '@components';

const MONTH_LABELS_SHORT = [
  'Jan.',
  'Feb.',
  'Mar.',
  'Apr.',
  'May.',
  'Jun.',
  'Jul.',
  'Aug.',
  'Sep.',
  'Oct.',
  'Nov.',
  'Dec.',
] as const;

export function createCalendarDate(year: number, month: number, day: number) {
  const date = new Date(year, month, day);
  date.setHours(12, 0, 0, 0);
  return date;
}

export function createTodayCalendarDate() {
  const now = new Date();

  return createCalendarDate(now.getFullYear(), now.getMonth(), now.getDate());
}

export function cloneCalendarDate(value: Date) {
  return createCalendarDate(value.getFullYear(), value.getMonth(), value.getDate());
}

export function addDays(date: Date, amount: number) {
  return createCalendarDate(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

export function getMondayOffset(date: Date) {
  const weekDay = date.getDay();

  return weekDay === 0 ? -6 : 1 - weekDay;
}

export function getMondayBasedDayIndex(date: Date) {
  const day = date.getDay();

  return day === 0 ? 6 : day - 1;
}

export function createWeekValue(date: Date): DatePickerWeekValue {
  const startDate = addDays(cloneCalendarDate(date), getMondayOffset(date));

  return {
    startDate,
    endDate: addDays(startDate, 6),
  };
}

export function normalizeWeekValue(value: DatePickerWeekValue) {
  return createWeekValue(value.startDate);
}

export function getWeekDays(startDate: Date) {
  return Array.from({ length: 7 }, (_, index) => addDays(startDate, index));
}

export function isDateWithinWeek(date: Date, week: DatePickerWeekValue) {
  const timestamp = cloneCalendarDate(date).getTime();

  return timestamp >= cloneCalendarDate(week.startDate).getTime() && timestamp <= cloneCalendarDate(week.endDate).getTime();
}

export function resolveNextSelectedDate(
  week: DatePickerWeekValue,
  previousSelectedDate: Date,
  today: Date,
) {
  if (isDateWithinWeek(today, week)) {
    return today;
  }

  return addDays(week.startDate, getMondayBasedDayIndex(previousSelectedDate));
}

export function formatTwoDigits(value: number) {
  return String(value).padStart(2, '0');
}

export function formatHeaderDate(date: Date) {
  return `${formatTwoDigits(date.getDate())}. ${MONTH_LABELS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}