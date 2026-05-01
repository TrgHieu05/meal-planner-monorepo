import type { IconProps } from '@tamagui/helpers-icon'
import { Check, ChevronLeft } from '@tamagui/lucide-icons-2'
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ElementType } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import type { GetProps } from 'tamagui'
import { SizableText, XStack, YStack, styled } from 'tamagui'

const InputSelectField = styled(XStack, {
	name: 'InputSelectField',
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

const InputSelectIconButton = styled(XStack, {
	name: 'InputSelectIconButton',
	w: 32,
	h: 32,
	br: '$pill',
	ai: 'center',
	jc: 'center',
	flexShrink: 0,
})

const InputSelectPopover = styled(YStack, {
	name: 'InputSelectPopover',
	bg: '$background',
	br: '$md',
	py: '$xs',
	overflow: 'hidden',
	shadowColor: '$color.gray10',
	shadowOpacity: 0.08,
	shadowRadius: 20,
	shadowOffset: { width: 5, height: 5 },
	elevation: 10,
})

const InputSelectOptionRow = styled(XStack, {
	name: 'InputSelectOptionRow',
	minHeight: 44,
	px: '$md',
	py: '$sm',
	ai: 'center',
	jc: 'space-between',
	gap: '$sm',

	pressStyle: {
		bg: '$surfacePress',
	},

	variants: {
		selected: {
			true: {
				bg: '$surface',
			},
		},
		disabled: {
			true: {
				opacity: 0.45,
			},
		},
	} as const,
})

type InputSelectFieldProps = GetProps<typeof InputSelectField>

export type InputSelectOption = {
	label: string
	value: string
	disabled?: boolean
}

export type InputSelectProps = Omit<InputSelectFieldProps, 'children' | 'onPress'> & {
	options: ReadonlyArray<InputSelectOption | string>
	value?: string
	defaultValue?: string
	placeholder?: string
	icon?: ElementType<IconProps>
	containerProps?: GetProps<typeof YStack>
	listAlign?: 'left' | 'right'
	listWidth?: number
	error?: boolean
	errorMessage?: string
	listMaxHeight?: number
	onValueChange?: (value: string) => void
}

type AnchorLayout = {
	x: number
	y: number
	width: number
	height: number
}

export const InputSelect = forwardRef<any, InputSelectProps>(function InputSelect(
	{
		options,
		value,
		defaultValue,
		placeholder = 'Select an option',
		icon: Icon = ChevronLeft,
		containerProps,
		listAlign = 'right',
		listWidth,
		error = false,
		errorMessage,
		disabled,
		listMaxHeight = 280,
		onValueChange,
		...props
	},
	ref,
) {
	const triggerRef = useRef<any>(null)
	const { width: screenWidth, height: screenHeight } = useWindowDimensions()
	const [anchorLayout, setAnchorLayout] = useState<AnchorLayout | null>(null)
	const [isOpen, setIsOpen] = useState(false)
	const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
	const hasError = error || Boolean(errorMessage)

	const normalizedOptions = useMemo<InputSelectOption[]>(
		() =>
			options.map((option) =>
				typeof option === 'string'
					? {
						  label: option,
						  value: option,
					  }
					: option,
			),
		[options],
	)

	const selectedValue = value ?? uncontrolledValue
	const selectedOption = useMemo(
		() => normalizedOptions.find((option) => option.value === selectedValue),
		[normalizedOptions, selectedValue],
	)

	const isDisabled = disabled || normalizedOptions.length === 0

	const setForwardedRef = useCallback(
		(node: any) => {
			triggerRef.current = node

			if (typeof ref === 'function') {
				ref(node)
				return
			}

			if (ref) {
				ref.current = node
			}
		},
		[ref],
	)

	const measureAnchor = useCallback((callback?: () => void) => {
		const host = triggerRef.current as {
			measureInWindow?: (
				cb: (x: number, y: number, width: number, height: number) => void,
			) => void
		} | null

		if (!host?.measureInWindow) {
			callback?.()
			return
		}

		host.measureInWindow((x, y, width, height) => {
			setAnchorLayout({ x, y, width, height })
			callback?.()
		})
	}, [])

	const openPopover = useCallback(() => {
		if (isDisabled) {
			return
		}

		measureAnchor(() => {
			setIsOpen(true)
		})
	}, [isDisabled, measureAnchor])

	const closePopover = useCallback(() => {
		setIsOpen(false)
	}, [])

	const togglePopover = useCallback(() => {
		if (isOpen) {
			closePopover()
			return
		}

		openPopover()
	}, [closePopover, isOpen, openPopover])

	const handleSelect = useCallback(
		(nextValue: string) => {
			if (value === undefined) {
				setUncontrolledValue(nextValue)
			}

			onValueChange?.(nextValue)
			closePopover()
		},
		[closePopover, onValueChange, value],
	)

	useEffect(() => {
		if (!isOpen) {
			return
		}

		measureAnchor()
	}, [isOpen, measureAnchor, screenHeight, screenWidth])

	const maxPopoverWidth = Math.max(screenWidth - 32, 120)
	const basePopoverWidth =
		typeof listWidth === 'number' && Number.isFinite(listWidth) && listWidth > 0
			? listWidth
			: anchorLayout
				? Math.max(anchorLayout.width, 220)
				: 220
	const popoverWidth = Math.min(Math.max(basePopoverWidth, 120), maxPopoverWidth)
	const popoverLeft = anchorLayout
		? Math.max(
			  16,
			  Math.min(
				listAlign === 'left'
					? anchorLayout.x
					: anchorLayout.x + anchorLayout.width - popoverWidth,
				screenWidth - popoverWidth - 16,
			  ),
		  )
		: 16
	const popoverTop = anchorLayout ? anchorLayout.y + anchorLayout.height + 8 : 16
	const popoverMaxHeight = Math.max(
		132,
		Math.min(listMaxHeight, Math.max(screenHeight - popoverTop - 16, 132)),
	)

	return (
		<YStack w="100%" gap="$xs" {...containerProps}>
			<InputSelectField
				ref={setForwardedRef}
				error={hasError}
				disabled={isDisabled}
				onPress={togglePopover}
				outlineWidth={isOpen || hasError ? 1.5 : 0}
				outlineColor={hasError ? '$danger' : '$primary'}
				accessibilityRole="button"
				accessibilityState={{ disabled: isDisabled, expanded: isOpen }}
				{...props}
			>
				<SizableText
					ff="$body"
					fos="$md"
                    fow="$medium"
					col={selectedOption ? '$text' : '$textSubtle'}
					flex={1}
					numberOfLines={1}
				>
					{selectedOption?.label ?? placeholder}
				</SizableText>

				<InputSelectIconButton>
					<Icon color={hasError ? '$textDanger' : '$textPrimary'} size={24} />
				</InputSelectIconButton>
			</InputSelectField>

			{errorMessage ? (
				<SizableText ff="$body" fos="$sm" col="$danger">
					{errorMessage}
				</SizableText>
			) : null}

			<Modal
				transparent
				visible={isOpen}
				animationType="fade"
				onRequestClose={closePopover}
				statusBarTranslucent
			>
				<Pressable style={StyleSheet.absoluteFill} onPress={closePopover}>
					{anchorLayout ? (
						<Pressable
							style={{
								position: 'absolute',
								top: popoverTop + 28,
								left: popoverLeft,
								width: popoverWidth,
							}}
							onPress={(event) => {
								event.stopPropagation()
							}}
						>
							<InputSelectPopover>
								<ScrollView
									showsVerticalScrollIndicator={false}
									nestedScrollEnabled
									style={{ maxHeight: popoverMaxHeight }}
								>
									{normalizedOptions.map((option) => {
										const isSelected = option.value === selectedValue

										return (
											<InputSelectOptionRow
												key={option.value}
												selected={isSelected}
												disabled={option.disabled}
												onPress={
													option.disabled
														? undefined
														: () => handleSelect(option.value)
												}
											>
												<SizableText
													ff="$body"
													fos="$md"
                                                    fow="$medium"
													col={isSelected ? '$primary' : '$text'}
													flex={1}
												>
													{option.label}
												</SizableText>

												{isSelected ? <Check color="$primary" size={18} /> : null}
											</InputSelectOptionRow>
										)
									})}
								</ScrollView>
							</InputSelectPopover>
						</Pressable>
					) : null}
				</Pressable>
			</Modal>
		</YStack>
	)
})
