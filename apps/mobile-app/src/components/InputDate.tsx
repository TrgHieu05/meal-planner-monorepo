import { Calendar } from '@tamagui/lucide-icons-2'
import { useMemo, useState } from 'react'
import type { ReactElement } from 'react'
import type { GetProps } from 'tamagui'
import { SizableText, XStack, YStack, styled, useTheme } from 'tamagui'

import {
	DatePicker,
	formatDatePickerValue,
	type DatePickerMode,
	type DatePickerWeekValue,
} from './DatePicker'

const InputDateField = styled(XStack, {
	name: 'InputDateField',
	w: '100%',
	minHeight: 52,
	br: '$md',
	bw: 0,
	px: '$md',
	py: '$xs',
	ai: 'center',
	jc: 'space-between',
	gap: '$sm',
	bg: '$surface',

	variants: {
		error: {
			true: {
				outlineWidth: 1.5,
				outlineColor: '$danger',
			},
		},
	} as const,

	pressStyle: {
		bg: '$surfacePress',
	},

	disabledStyle: {
		opacity: 0.6,
	},
})

const InputDateIconButton = styled(XStack, {
	name: 'InputDateIconButton',
	w: 32,
	h: 32,
	br: '$pill',
	ai: 'center',
	jc: 'center',
	flexShrink: 0,
})

type InputDateFieldProps = GetProps<typeof InputDateField>

type InputDateBaseProps = Omit<InputDateFieldProps, 'children' | 'onPress'> & {
	placeholder?: string
	error?: boolean
	errorMessage?: string
	yearBefore?: number
	yearAfter?: number
}

export type InputDateSingleProps = InputDateBaseProps & {
	mode?: 'single'
	value?: Date | null
	defaultValue?: Date | null
	onValueChange?: (value: Date) => void
}

export type InputDateWeekProps = InputDateBaseProps & {
	mode: 'week'
	value?: DatePickerWeekValue | null
	defaultValue?: DatePickerWeekValue | null
	onValueChange?: (value: DatePickerWeekValue) => void
}

export type InputDateProps = InputDateSingleProps | InputDateWeekProps

type AnyInputDateValue = Date | DatePickerWeekValue | null

export function InputDate(props: InputDateSingleProps): ReactElement
export function InputDate(props: InputDateWeekProps): ReactElement
export function InputDate(props: InputDateProps) {
	const theme = useTheme()
	const mode: DatePickerMode = props.mode ?? 'single'
	const {
		placeholder = mode === 'week' ? 'Select a week' : 'Select a date',
		error = false,
		errorMessage,
		disabled,
		yearBefore,
		yearAfter,
		value,
		defaultValue,
		onValueChange,
		...fieldProps
	} = props
	const hasError = error || Boolean(errorMessage)
	const isDisabled = Boolean(disabled)
	const [isOpen, setIsOpen] = useState(false)
	const [uncontrolledValue, setUncontrolledValue] = useState<AnyInputDateValue>(
		defaultValue ?? null,
	)
	const selectedValue = value === undefined ? uncontrolledValue : value

	const displayValue = useMemo(() => {
		if (!selectedValue) {
			return placeholder
		}

		return formatDatePickerValue(mode, selectedValue as Date | DatePickerWeekValue)
	}, [mode, placeholder, selectedValue])

	const handleOpen = () => {
		if (isDisabled) {
			return
		}

		setIsOpen(true)
	}

	const handleValueChange = (nextValue: Date | DatePickerWeekValue) => {
		if (value === undefined) {
			setUncontrolledValue(nextValue)
		}

		if (mode === 'week') {
			(onValueChange as InputDateWeekProps['onValueChange'])?.(nextValue as DatePickerWeekValue)
		} else {
			(onValueChange as InputDateSingleProps['onValueChange'])?.(nextValue as Date)
		}
	}

	return (
		<YStack w="100%" gap="$xs">
			<InputDateField
				error={hasError}
				disabled={isDisabled}
				onPress={handleOpen}
				outlineWidth={isOpen || hasError ? 1.5 : 0}
				outlineColor={hasError ? '$danger' : '$primary'}
				accessibilityRole="button"
				accessibilityState={{ disabled: isDisabled, expanded: isOpen }}
				{...fieldProps}
			>
				<SizableText
					ff="$body"
					fos="$md"
					fow="$medium"
					col={selectedValue ? '$text' : '$textSubtle'}
					flex={1}
					numberOfLines={1}
				>
					{displayValue}
				</SizableText>

				<InputDateIconButton>
					<Calendar color={hasError ? theme.textDanger.val : theme.textPrimary.val} size={20} />
				</InputDateIconButton>
			</InputDateField>

			{errorMessage ? (
				<SizableText ff="$body" fos="$sm" col="$danger">
					{errorMessage}
				</SizableText>
			) : null}

			{mode === 'week' ? (
				<DatePicker
					mode="week"
					open={isOpen}
					onOpenChange={setIsOpen}
					value={(selectedValue as DatePickerWeekValue | null | undefined) ?? null}
					yearBefore={yearBefore}
					yearAfter={yearAfter}
					onValueChange={handleValueChange as (value: DatePickerWeekValue) => void}
				/>
			) : (
				<DatePicker
					open={isOpen}
					onOpenChange={setIsOpen}
					value={(selectedValue as Date | null | undefined) ?? null}
					yearBefore={yearBefore}
					yearAfter={yearAfter}
					onValueChange={handleValueChange as (value: Date) => void}
				/>
			)}
		</YStack>
	)
}