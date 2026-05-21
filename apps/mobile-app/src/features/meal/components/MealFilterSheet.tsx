import { useEffect, useMemo, useState } from 'react'
import { Modal, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SizableText, Slider, XStack, YStack, getTokens } from 'tamagui'

import { Button, Chip } from '@components'
import {
	areMealCookingTimeFiltersEqual,
	MEAL_COOKING_TIME_MAX,
	MEAL_COOKING_TIME_MIN,
	normalizeMealCookingTimeFilter,
	sanitizeMealCookingTimeFilter,
	type MealCookingTimeFilter,
	type MealDifficultyFilter,
	type MealFilters,
} from './meal-filters'

export {
	cloneMealFilters,
	createEmptyMealFilters,
	hasAppliedMealFilters,
	isDefaultMealCookingTimeFilter,
	MEAL_COOKING_TIME_MAX,
	MEAL_COOKING_TIME_MIN,
	normalizeMealCookingTimeFilter,
	sanitizeMealCookingTimeFilter,
} from './meal-filters'

export type {
	MealCookingTimeFilter,
	MealDifficultyFilter,
	MealFilters,
} from './meal-filters'

const difficultyOptions: ReadonlyArray<{
	label: string
	value: MealDifficultyFilter
}> = [
	{ label: 'Easy', value: 'easy' },
	{ label: 'Medium', value: 'medium' },
	{ label: 'Hard', value: 'hard' },
]

type MealFilterSheetProps = {
	open: boolean
	filters: MealFilters
	onClose: () => void
	onClear: () => void
	onApply: (cookingTime: MealCookingTimeFilter) => void
	onSelectDifficulty: (difficulty: MealDifficultyFilter) => void
}

function formatMealCookingTimeLabel(value: number) {
	if (value < 60) {
		return `${value} mins`
	}

	const hours = Math.floor(value / 60)
	const remainingMinutes = value % 60

	if (remainingMinutes === 0) {
		return hours === 1 ? '1 hour' : `${hours} hours`
	}

	return `${hours === 1 ? '1 hour' : `${hours} hours`} ${remainingMinutes} mins`
}

export function MealFilterSheet({
	open,
	filters,
	onClose,
	onClear,
	onApply,
	onSelectDifficulty,
}: MealFilterSheetProps) {
	const insets = useSafeAreaInsets()
	const spaceMdToken = getTokens().space.md.val
	const [pendingCookingTime, setPendingCookingTime] = useState(() =>
		sanitizeMealCookingTimeFilter(filters.cookingTime),
	)
	const pendingCookingTimeValues = useMemo(
		() => [pendingCookingTime.min, pendingCookingTime.max],
		[pendingCookingTime.max, pendingCookingTime.min],
	)

	useEffect(() => {
		if (!open) {
			return
		}

		const nextCookingTime = sanitizeMealCookingTimeFilter(filters.cookingTime)

		setPendingCookingTime((currentCookingTime) =>
			areMealCookingTimeFiltersEqual(currentCookingTime, nextCookingTime)
				? currentCookingTime
				: nextCookingTime,
		)
	}, [filters.cookingTime, open])

	const cookingTimeRangeLabel =
		pendingCookingTime.min === pendingCookingTime.max
			? formatMealCookingTimeLabel(pendingCookingTime.min)
			: `${formatMealCookingTimeLabel(pendingCookingTime.min)} - ${formatMealCookingTimeLabel(pendingCookingTime.max)}`

	function handleCookingTimeChange(values: readonly number[]) {
		const nextCookingTime = normalizeMealCookingTimeFilter(values)

		setPendingCookingTime((currentCookingTime) =>
			areMealCookingTimeFiltersEqual(currentCookingTime, nextCookingTime)
				? currentCookingTime
				: nextCookingTime,
		)
	}

	function handleClearPress() {
		setPendingCookingTime(sanitizeMealCookingTimeFilter(undefined))
		onClear()
	}

	function handleApplyPress() {
		onApply(pendingCookingTime)
	}
	

	return (
		<Modal
			animationType="slide"
			transparent
			statusBarTranslucent
			visible={open}
			onRequestClose={onClose}
		>
			<YStack f={1} jc="flex-end">
				<Pressable onPress={onClose} style={StyleSheet.absoluteFill} />
				<YStack
					w="100%"
					bg="$background"
					pt="$sm"
					px="$lg"
					pb={insets.bottom + spaceMdToken}
					gap="$xl"
					borderTopLeftRadius={28}
					borderTopRightRadius={28}
				>
					<YStack ai="center" gap="$md">
						<YStack w={56} h={4} br="$pill" bg="$color.gray6" />
						<SizableText ff="$heading" fos={20} fow="$bold" col="$text">
							Filter Meals
						</SizableText>
					</YStack>

					<YStack gap="$sm">
						<SizableText ff="$body" fos="$md" fow="$semiBold" col="$textSubtle">
							Difficulty
						</SizableText>
						<XStack flexWrap="wrap" gap="$sm">
							{difficultyOptions.map((option) => {
								const selected = filters.difficulty === option.value

								return (
									<Chip key={option.value} tone={selected ? 'brand' : 'neutral'} onPress={() => onSelectDifficulty(option.value)}>
										<Chip.Text>{option.label}</Chip.Text>
									</Chip>
								)
							})}
						</XStack>
					</YStack>

					<YStack gap="$sm">
						<SizableText ff="$body" fos="$md" fow="$semiBold" col="$textSubtle">
							Cooking Time
						</SizableText>
						<SizableText ff="$body" fos="$md" fow="$medium" col="$text">
							{cookingTimeRangeLabel}
						</SizableText>
						<YStack px="$xs" pt="$md" gap="$md">
							<Slider
								w="100%"
								min={MEAL_COOKING_TIME_MIN}
								max={MEAL_COOKING_TIME_MAX}
								step={1}
								minStepsBetweenThumbs={0}
								value={pendingCookingTimeValues}
								onValueChange={handleCookingTimeChange}
								
							>
								<Slider.Track h={8} br="$pill" bg="$surface">
									<Slider.TrackActive bg="$primary" />
								</Slider.Track>
								<Slider.Thumb borderColor="$primary" circular index={0} size={24} />
								<Slider.Thumb borderColor="$primary" circular index={1} size={24} />
							</Slider>
							<XStack jc="space-between" ai="center">
								<SizableText ff="$body" fos="$sm" fow="$medium" col="$textSubtle">
									{formatMealCookingTimeLabel(MEAL_COOKING_TIME_MIN)}
								</SizableText>
								<SizableText ff="$body" fos="$sm" fow="$medium" col="$textSubtle">
									{formatMealCookingTimeLabel(MEAL_COOKING_TIME_MAX)}
								</SizableText>
							</XStack>
						</YStack>
					</YStack>

					<XStack w="100%" gap="$md">
						<Button
							f={1}
							h={52}
							br="$pill"
							color="secondary"
						onPress={handleClearPress}
						>
							<Button.Text>Clear</Button.Text>
						</Button>
					<Button f={1} h={52} br="$pill" color="primary" onPress={handleApplyPress}>
							<Button.Text>Apply</Button.Text>
						</Button>
					</XStack>
				</YStack>
			</YStack>
		</Modal>
	)
}
