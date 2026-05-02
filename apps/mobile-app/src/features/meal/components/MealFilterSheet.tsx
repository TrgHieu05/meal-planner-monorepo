import { Modal, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SizableText, XStack, YStack, getTokens } from 'tamagui'

import { Button, Chip, RadioButton } from '@components'

export type MealDifficultyFilter = 'Easy' | 'Medium' | 'Hard'
export type MealCookingTimeFilter = '<30m' | '<45m' | '<1hour'

export type MealFilters = {
	difficulty: MealDifficultyFilter[]
	cookingTime: MealCookingTimeFilter | null
}

const difficultyOptions: MealDifficultyFilter[] = ['Easy', 'Medium', 'Hard']
const cookingTimeOptions: MealCookingTimeFilter[] = ['<30m', '<45m', '<1hour']

type MealFilterSheetProps = {
	open: boolean
	filters: MealFilters
	onClose: () => void
	onClear: () => void
	onApply: () => void
	onToggleDifficulty: (difficulty: MealDifficultyFilter) => void
	onSelectCookingTime: (cookingTime: MealCookingTimeFilter) => void
}

export function createEmptyMealFilters(): MealFilters {
	return {
		difficulty: [],
		cookingTime: null,
	}
}

export function cloneMealFilters(filters: MealFilters): MealFilters {
	return {
		difficulty: [...filters.difficulty],
		cookingTime: filters.cookingTime,
	}
}

export function hasAppliedMealFilters(filters: MealFilters) {
	return filters.difficulty.length > 0 || filters.cookingTime !== null
}

export function MealFilterSheet({
	open,
	filters,
	onClose,
	onClear,
	onApply,
	onToggleDifficulty,
	onSelectCookingTime,
}: MealFilterSheetProps) {
	const insets = useSafeAreaInsets()
    const spaceMdToken = getTokens().space.md.val
	

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
								const selected = filters.difficulty.includes(option)

								return (
									<Chip key={option} tone={selected ? 'brand' : 'neutral'} onPress={() => onToggleDifficulty(option)}>
										<Chip.Text>{option}</Chip.Text>
									</Chip>
								)
							})}
						</XStack>
					</YStack>

					<YStack gap="$sm">
						<SizableText ff="$body" fos="$md" fow="$semiBold" col="$textSubtle">
							Cooking Time
						</SizableText>
						<XStack flexWrap="wrap" gap="$lg">
							{cookingTimeOptions.map((option) => (
								<RadioButton
									key={option}
									label={option}
									selected={filters.cookingTime === option}
									onPress={() => onSelectCookingTime(option)}
								/>
							))}
						</XStack>
					</YStack>

					<XStack w="100%" gap="$md">
						<Button
							f={1}
							h={52}
							br="$pill"
							color="secondary"
							onPress={onClear}
						>
							<Button.Text>Clear</Button.Text>
						</Button>
						<Button f={1} h={52} br="$pill" color="primary" onPress={onApply}>
							<Button.Text>Apply</Button.Text>
						</Button>
					</XStack>
				</YStack>
			</YStack>
		</Modal>
	)
}
