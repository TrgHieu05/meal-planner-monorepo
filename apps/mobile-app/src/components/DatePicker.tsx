import { ChevronDown } from '@tamagui/lucide-icons-2'
import { useEffect, useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet } from 'react-native'
import { SizableText, XStack, YStack, styled } from 'tamagui'

import type { InputSelectOption } from './InputSelect'
import { InputSelect } from './InputSelect'
import { ChevronLeft } from 'lucide-react-native'

const MONTH_LABELS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
] as const

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
] as const

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const

const DatePickerCard = styled(YStack, {
	name: 'DatePickerCard',
	w: '100%',
	maw: 360,
	bg: '$background',
	br: 24,
	p: '$lg',
	gap: '$lg',
	overflow: 'visible',
	shadowColor: '#111827',
	shadowOpacity: 0.12,
	shadowRadius: 20,
	shadowOffset: { width: 0, height: 10 },
	elevation: 16,
})

const DatePickerFooterButton = styled(XStack, {
	name: 'DatePickerFooterButton',
	f: 1,
	h: 48,
	br: 12,
	ai: 'center',
	jc: 'center',
	gap: '$xs',

	variants: {
		tone: {
			primary: {
				bg: '$primary',
				pressStyle: {
					bg: '$primaryPress',
				},
			},
			secondary: {
				bg: '$surface',
				pressStyle: {
					bg: '$surfacePress',
				},
			},
		},
		disabled: {
			true: {
				opacity: 0.45,
			},
		},
	} as const,
})

export type DatePickerMode = 'single' | 'week'

export type DatePickerWeekValue = {
	startDate: Date
	endDate: Date
}

type DatePickerBaseProps = {
	open: boolean
	onOpenChange?: (open: boolean) => void
	yearBefore?: number
	yearAfter?: number
	cancelLabel?: string
	applyLabel?: string
}

export type DatePickerSingleProps = DatePickerBaseProps & {
	mode?: 'single'
	value?: Date | null
	defaultValue?: Date | null
	onValueChange?: (value: Date) => void
}

export type DatePickerWeekProps = DatePickerBaseProps & {
	mode: 'week'
	value?: DatePickerWeekValue | null
	defaultValue?: DatePickerWeekValue | null
	onValueChange?: (value: DatePickerWeekValue) => void
}

export type DatePickerProps = DatePickerSingleProps | DatePickerWeekProps

type AnyDatePickerValue = Date | DatePickerWeekValue | null

const createCalendarDate = (year: number, month: number, day: number) => {
	const date = new Date(year, month, day)
	date.setHours(12, 0, 0, 0)
	return date
}

const cloneDateValue = (value?: Date | null) => {
	if (!value) {
		return null
	}

	return createCalendarDate(value.getFullYear(), value.getMonth(), value.getDate())
}

const addDays = (date: Date, amount: number) =>
	createCalendarDate(date.getFullYear(), date.getMonth(), date.getDate() + amount)

const startOfMonth = (date: Date) => createCalendarDate(date.getFullYear(), date.getMonth(), 1)

const endOfMonth = (date: Date) => createCalendarDate(date.getFullYear(), date.getMonth() + 1, 0)

const getMondayOffset = (date: Date) => {
	const weekDay = date.getDay()

	return weekDay === 0 ? -6 : 1 - weekDay
}

const startOfWeek = (date: Date) => addDays(date, getMondayOffset(date))

const endOfWeek = (date: Date) => addDays(startOfWeek(date), 6)

const isSameDay = (left: Date, right: Date) =>
	left.getFullYear() === right.getFullYear() &&
	left.getMonth() === right.getMonth() &&
	left.getDate() === right.getDate()

const isDateWithinRange = (date: Date, startDate: Date, endDate: Date) => {
	const timestamp = cloneDateValue(date)?.getTime() ?? 0
	const startTimestamp = cloneDateValue(startDate)?.getTime() ?? 0
	const endTimestamp = cloneDateValue(endDate)?.getTime() ?? 0

	return timestamp >= startTimestamp && timestamp <= endTimestamp
}

const createWeekValue = (date: Date): DatePickerWeekValue => {
	const startDate = startOfWeek(date)

	return {
		startDate,
		endDate: endOfWeek(startDate),
	}
}

const cloneWeekValue = (value?: DatePickerWeekValue | null) => {
	if (!value) {
		return null
	}

	return {
		startDate: cloneDateValue(value.startDate)!,
		endDate: cloneDateValue(value.endDate)!,
	}
}

const clonePickerValue = (mode: DatePickerMode, value?: AnyDatePickerValue) => {
	if (!value) {
		return null
	}

	return mode === 'week'
		? cloneWeekValue(value as DatePickerWeekValue)
		: cloneDateValue(value as Date)
}

const buildCalendarWeeks = (visibleMonth: Date) => {
	const firstVisibleDate = startOfWeek(startOfMonth(visibleMonth))
	const lastVisibleDate = endOfWeek(endOfMonth(visibleMonth))
	const weeks: Date[][] = []

	for (
		let weekStart = firstVisibleDate;
		weekStart.getTime() <= lastVisibleDate.getTime();
		weekStart = addDays(weekStart, 7)
	) {
		weeks.push(Array.from({ length: 7 }, (_, dayIndex) => addDays(weekStart, dayIndex)))
	}

	return weeks
}

const resolveAnchorDate = (mode: DatePickerMode, value: AnyDatePickerValue, fallbackDate: Date) => {
	if (!value) {
		return fallbackDate
	}

	if (mode === 'week') {
		return cloneDateValue((value as DatePickerWeekValue).startDate) ?? fallbackDate
	}

	return cloneDateValue(value as Date) ?? fallbackDate
}

const formatTwoDigit = (value: number) => String(value).padStart(2, '0')

export const formatSingleDateInputValue = (value: Date) =>
	`${formatTwoDigit(value.getDate())}.${formatTwoDigit(value.getMonth() + 1)}.${value.getFullYear()}`

const formatCalendarRangeLabel = (value: Date) =>
	`${formatTwoDigit(value.getDate())}. ${MONTH_LABELS_SHORT[value.getMonth()]} ${value.getFullYear()}`

export const formatWeekDateInputValue = (value: DatePickerWeekValue) =>
	`${formatCalendarRangeLabel(value.startDate)} - ${formatCalendarRangeLabel(value.endDate)}`

export const formatDatePickerValue = (mode: DatePickerMode, value: Date | DatePickerWeekValue) =>
	mode === 'week'
		? formatWeekDateInputValue(value as DatePickerWeekValue)
		: formatSingleDateInputValue(value as Date)

export function DatePicker(props: DatePickerSingleProps): ReactElement
export function DatePicker(props: DatePickerWeekProps): ReactElement
export function DatePicker(props: DatePickerProps) {
	const mode: DatePickerMode = props.mode ?? 'single'
	const yearBefore = Math.max(0, props.yearBefore ?? 100)
	const yearAfter = Math.max(0, props.yearAfter ?? 10)
	const cancelLabel = props.cancelLabel ?? 'Cancel'
	const applyLabel = props.applyLabel ?? 'Apply'
	const today = useMemo(() => {
		const now = new Date()
		return createCalendarDate(now.getFullYear(), now.getMonth(), now.getDate())
	}, [])
	const currentYear = today.getFullYear()
	const [uncontrolledValue, setUncontrolledValue] = useState<AnyDatePickerValue>(() =>
		clonePickerValue(mode, props.defaultValue ?? null),
	)
	const committedValue = props.value === undefined ? uncontrolledValue : props.value
	const [draftValue, setDraftValue] = useState<AnyDatePickerValue>(() =>
		clonePickerValue(mode, committedValue ?? null),
	)
	const [visibleMonth, setVisibleMonth] = useState(() =>
		startOfMonth(resolveAnchorDate(mode, committedValue ?? null, today)),
	)

	useEffect(() => {
		if (!props.open) {
			return
		}

		const nextDraftValue = clonePickerValue(mode, committedValue ?? null)

		setDraftValue(nextDraftValue)
		setVisibleMonth(startOfMonth(resolveAnchorDate(mode, nextDraftValue, today)))
	}, [committedValue, mode, props.open, today])

	const yearOptions = useMemo(
		() =>
			Array.from({ length: yearBefore + yearAfter + 1 }, (_, index) => ({
				label: `${currentYear - yearBefore + index}`,
				value: `${currentYear - yearBefore + index}`,
			})),
		[currentYear, yearAfter, yearBefore],
	)
	const monthOptions = useMemo<ReadonlyArray<InputSelectOption>>(
		() => MONTH_LABELS.map((label, index) => ({ label, value: `${index}` })),
		[],
	)

	const calendarWeeks = useMemo(() => buildCalendarWeeks(visibleMonth), [visibleMonth])
	const singleDraftValue = mode === 'single' && draftValue instanceof Date ? draftValue : null
	const weekDraftValue =
		mode === 'week' && draftValue && !(draftValue instanceof Date)
			? (draftValue as DatePickerWeekValue)
			: null
	const canApply = Boolean(draftValue)

	const handleOpenChange = (nextOpen: boolean) => {
		props.onOpenChange?.(nextOpen)
	}

	const handleCancel = () => {
		handleOpenChange(false)
	}

	const handleApply = () => {
		if (!draftValue) {
			return
		}

		const nextValue = clonePickerValue(mode, draftValue)

		if (props.value === undefined) {
			setUncontrolledValue(nextValue)
		}

		if (mode === 'week') {
			(props as DatePickerWeekProps).onValueChange?.(nextValue as DatePickerWeekValue)
		} else {
			(props as DatePickerSingleProps).onValueChange?.(nextValue as Date)
		}

		handleOpenChange(false)
	}

	const handleDayPress = (day: Date) => {
		if (mode === 'week') {
			setDraftValue(createWeekValue(day))
		} else {
			setDraftValue(cloneDateValue(day))
		}

		if (day.getMonth() !== visibleMonth.getMonth() || day.getFullYear() !== visibleMonth.getFullYear()) {
			setVisibleMonth(startOfMonth(day))
		}
	}

	const handleMonthChange = (nextMonth: string) => {
		const parsedMonth = Number.parseInt(nextMonth, 10)

		if (!Number.isInteger(parsedMonth) || parsedMonth < 0 || parsedMonth > 11) {
			return
		}

		setVisibleMonth(createCalendarDate(visibleMonth.getFullYear(), parsedMonth, 1))
	}

	const handleYearChange = (nextYear: string) => {
		const parsedYear = Number.parseInt(nextYear, 10)

		if (!Number.isInteger(parsedYear)) {
			return
		}

		setVisibleMonth(createCalendarDate(parsedYear, visibleMonth.getMonth(), 1))
	}

	return (
		<Modal
			transparent
			visible={props.open}
			animationType="fade"
			onRequestClose={handleCancel}
			statusBarTranslucent
		>
			<Pressable style={styles.backdrop} onPress={handleCancel}>
				<YStack f={1} ai="center" jc="center" px="$md">
					<Pressable
						style={styles.cardWrap}
						onPress={(event) => {
							event.stopPropagation()
						}}
					>
						<DatePickerCard>
							<XStack gap="$sm" overflow="visible" zi={10}>
								<InputSelect
									options={monthOptions}
									value={`${visibleMonth.getMonth()}`}
									onValueChange={handleMonthChange}
									listMaxHeight={220}
									containerProps={{ f: 1, w: 0 }}
                                    listAlign="left"
								/>

								<InputSelect
									options={yearOptions}
									value={`${visibleMonth.getFullYear()}`}
									onValueChange={handleYearChange}
									listMaxHeight={220}
									containerProps={{ f: 1, w: 0 }}
								/>
							</XStack>

							<XStack px={2}>
								{WEEKDAY_LABELS.map((label) => (
									<YStack key={label} f={1} ai="center" jc="center">
										<SizableText ff="$body" fos="$sm" fow="$bold" col="$textSubtle">
											{label}
										</SizableText>
									</YStack>
								))}
							</XStack>

							<YStack gap="$xs">
								{calendarWeeks.map((week, weekIndex) => (
									<XStack key={`${visibleMonth.getFullYear()}-${visibleMonth.getMonth()}-${weekIndex}`}> 
										{week.map((day, dayIndex) => {
											const isOutsideMonth = day.getMonth() !== visibleMonth.getMonth()
											const isSelectedDay = Boolean(singleDraftValue && isSameDay(day, singleDraftValue))
											const isRangeStart = Boolean(weekDraftValue && isSameDay(day, weekDraftValue.startDate))
											const isRangeEnd = Boolean(weekDraftValue && isSameDay(day, weekDraftValue.endDate))
											const isInSelectedRange = Boolean(
												weekDraftValue &&
												isDateWithinRange(day, weekDraftValue.startDate, weekDraftValue.endDate),
											)
											const shouldHighlightCircle = isSelectedDay || isRangeStart || isRangeEnd
											const textColor = shouldHighlightCircle
												? '$textInverse'
												: isInSelectedRange
													? '$textPrimary'
													: isOutsideMonth
														? '$textSubtle'
														: '$text'

											return (
												<YStack key={`${day.toISOString()}-${dayIndex}`} f={1} ai="center" jc="center">
													<XStack
														w="100%"
														h={40}
														ai="center"
														jc="center"
														bg={isInSelectedRange ? '$softPrimary' : 'transparent'}
														br={
															isInSelectedRange
																? dayIndex === 0
																	? 999
																	: dayIndex === 6
																		? 999
																		: 0
																: 0
														}
													>
														<XStack
															w={36}
															h={36}
															br="$pill"
															ai="center"
															jc="center"
															bg={shouldHighlightCircle ? '$primary' : 'transparent'}
															onPress={() => handleDayPress(day)}
															pressStyle={{ opacity: 0.86 }}
														>
															<SizableText ff="$body" fos="$md" fow="$semiBold" col={textColor}>
																{day.getDate()}
															</SizableText>
														</XStack>
													</XStack>
												</YStack>
											)
										})}
									</XStack>
								))}
							</YStack>

							<XStack gap="$sm">
								<DatePickerFooterButton tone="secondary" onPress={handleCancel}>
									<SizableText ff="$body" fos="$md" fow="$semiBold" col="$text">
										{cancelLabel}
									</SizableText>
								</DatePickerFooterButton>

								<DatePickerFooterButton
									tone="primary"
									disabled={!canApply}
									onPress={canApply ? handleApply : undefined}
								>
									<SizableText ff="$body" fos="$md" fow="$semiBold" col="$textInverse">
										{applyLabel}
									</SizableText>
								</DatePickerFooterButton>
							</XStack>
						</DatePickerCard>
					</Pressable>
				</YStack>
			</Pressable>
		</Modal>
	)
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: 'rgba(17, 24, 39, 0.48)',
	},
	cardWrap: {
		width: '100%',
		maxWidth: 360,
	},
})