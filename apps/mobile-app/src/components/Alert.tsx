import { Lock, X } from '@tamagui/lucide-icons-2'
import type { IconProps } from '@tamagui/helpers-icon'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SizableText, XStack, YStack, styled, useTheme } from 'tamagui'

export type AlertVariant = 'success' | 'error'

export type AlertProps = {
	variant?: AlertVariant
	title: string
	description: string
	icon?: React.ElementType<IconProps>
	open?: boolean
	defaultOpen?: boolean
	onOpenChange?: (open: boolean) => void
	duration?: number
	autoClose?: boolean
	showCloseButton?: boolean
}

const AlertViewport = styled(YStack, {
	name: 'AlertViewport',
	pos: 'absolute',
	l: '$md',
	r: '$md',
	zi: '$Modal',
	pointerEvents: 'box-none',
})

const AlertCard = styled(XStack, {
	name: 'AlertCard',
	ai: 'flex-start',
	jc: 'space-between',
	gap: '$sm',
	w: '100%',
	bg: '$background',
	br: '$md',
	p: "$md",
	shadowColor: '$color.gray14',
	shadowOpacity: 0.02,
	shadowRadius: 16,
	shadowOffset: { width: 0, height: 6 },
	elevation: 8,
})

const AlertContent = styled(YStack, {
	name: 'AlertContent',
	w: '100%',
	gap: '$xs',
})

const AlertProgressTrack = styled(YStack, {
	name: 'AlertProgressTrack',
	w: '100%',
	h: 4,
	bg: '$borderColor',
	br: '$pill',
	overflow: 'hidden',
})

const variantColor = {
	success: '$primary',
	error: '$danger',
} as const

export function Alert({
	variant = 'success',
	title,
	description,
	icon: Icon = Lock,
	open,
	defaultOpen = true,
	onOpenChange,
	duration = 5000,
	autoClose = true,
	showCloseButton = true,
}: AlertProps) {
	const insets = useSafeAreaInsets()
	const theme = useTheme()
	const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
	const isControlled = open !== undefined
	const isOpen = isControlled ? open : uncontrolledOpen
	const [isRendered, setIsRendered] = useState(isOpen)
	const [progressTrackWidth, setProgressTrackWidth] = useState(0)
	const accentColor = useMemo(() => variantColor[variant], [variant])
	const accentColorValue = variant === 'success' ? theme.primary.val : theme.danger.val
	const shouldShowTimerBar = autoClose && duration > 0
	const opacity = useRef(new Animated.Value(isOpen ? 1 : 0)).current
	const translateY = useRef(new Animated.Value(isOpen ? 0 : 28)).current
	const progress = useRef(new Animated.Value(shouldShowTimerBar && isOpen ? 1 : 0)).current

	const setOpen = useCallback(
		(nextOpen: boolean) => {
			if (!isControlled) {
				setUncontrolledOpen(nextOpen)
			}

			onOpenChange?.(nextOpen)
		},
		[isControlled, onOpenChange],
	)

	useEffect(() => {
		if (!isOpen || !shouldShowTimerBar) {
			return
		}

		const timeout = setTimeout(() => {
			setOpen(false)
		}, duration)

		return () => clearTimeout(timeout)
	}, [duration, isOpen, setOpen, shouldShowTimerBar])

	useEffect(() => {
		progress.stopAnimation()

		if (!isOpen || !shouldShowTimerBar) {
			return
		}

		progress.setValue(1)

		const progressAnimation = Animated.timing(progress, {
			toValue: 0,
			duration,
			easing: Easing.linear,
			useNativeDriver: true,
		})

		progressAnimation.start()

		return () => {
			progress.stopAnimation()
		}
	}, [duration, isOpen, progress, shouldShowTimerBar])

	useEffect(() => {
		if (isOpen) {
			setIsRendered(true)
			Animated.parallel([
				Animated.timing(opacity, {
					toValue: 1,
					duration: 240,
					easing: Easing.out(Easing.cubic),
					useNativeDriver: true,
				}),
				Animated.timing(translateY, {
					toValue: 0,
					duration: 240,
					easing: Easing.out(Easing.cubic),
					useNativeDriver: true,
				}),
			]).start()
			return
		}

		if (!isRendered) {
			return
		}

		Animated.parallel([
			Animated.timing(opacity, {
				toValue: 0,
				duration: 200,
				easing: Easing.in(Easing.cubic),
				useNativeDriver: true,
			}),
			Animated.timing(translateY, {
				toValue: 28,
				duration: 200,
				easing: Easing.in(Easing.cubic),
				useNativeDriver: true,
			}),
		]).start(({ finished }) => {
			if (finished) {
				setIsRendered(false)
			}
		})
	}, [isOpen, isRendered, opacity, translateY])

	if (!isRendered) {
		return null
	}

	const progressTranslateX =
		progressTrackWidth > 0
			? progress.interpolate({
					inputRange: [0, 1],
					outputRange: [-progressTrackWidth / 2, 0],
			  })
			: 0

	return (
		<AlertViewport b={Math.max(insets.bottom, 16)}>
			<Animated.View
				style={{
					opacity,
					transform: [{ translateY }],
				}}
			>
				<AlertContent>
					<AlertCard>
						<YStack f={1} gap="$sm" ai="center">
							<XStack w="100%" ai="center" jc="flex-start" gap="$sm">
								<Icon color={accentColor} size={20} />
								<SizableText ff="$body" fos="$lg" fow="$semiBold" col={accentColor}>
									{title}
								</SizableText>
							</XStack>

							<YStack f={1} gap="$xs">
								<SizableText ff="$body" fos="$sm" fow="$regular" col="$textSubtle">
									{description}
								</SizableText>
							</YStack>
						</YStack>

						{showCloseButton ? (
							<XStack
								pt={2}
								p="$xs"
								br="$pill"
								onPress={() => setOpen(false)}
								pressStyle={{ opacity: 0.65, scale: 0.96 }}
							>
								<X color={accentColor} size={20} />
							</XStack>
						) : null}
					</AlertCard>

					{shouldShowTimerBar ? (
						<AlertProgressTrack
							onLayout={(event) => {
								const nextWidth = event.nativeEvent.layout.width

								setProgressTrackWidth((currentWidth) =>
									currentWidth === nextWidth ? currentWidth : nextWidth,
								)
							}}
						>
							<Animated.View
								style={{
									width: '100%',
									height: '100%',
									backgroundColor: accentColorValue,
									borderRadius: 999,
									transform: [{ translateX: progressTranslateX }, { scaleX: progress }],
								}}
							/>
						</AlertProgressTrack>
					) : null}
				</AlertContent>
			</Animated.View>
		</AlertViewport>
	)
}