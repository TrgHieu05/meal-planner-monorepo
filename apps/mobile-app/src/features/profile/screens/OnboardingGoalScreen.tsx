import { useCallback, useState } from 'react'
import { useRouter } from 'expo-router'
import { Label, SizableText, XStack, YStack } from 'tamagui'

import { Button, InputSelect, InputText } from '@components'

import { useOnboardingProfile } from '../onboarding/OnboardingProfileProvider'
import {
	extractFieldErrors,
	validateOnboardingGoalStep,
} from '../utils/profile-form'

export default function OnboardingGoalScreen() {
	const router = useRouter()
	const { draft, options, isLoadingOptions, optionsError, reloadOptions, updateDraft } =
		useOnboardingProfile()
	const [fieldErrors, setFieldErrors] = useState<
		Partial<Record<'goalId' | 'targetCalories', string>>
	>({})
	const goalOptions = options.goals.map((goal) => ({
		label: goal.name,
		value: `${goal.id}`,
	}))

	const handleTargetCaloriesChange = useCallback((value: string) => {
		updateDraft({ targetCalories: value })
		setFieldErrors((current) => ({
			...current,
			targetCalories: undefined,
		}))
	}, [updateDraft])

	const handleGoalChange = useCallback((value: string) => {
		updateDraft({ goalId: Number.parseInt(value, 10) })
		setFieldErrors((current) => ({
			...current,
			goalId: undefined,
		}))
	}, [updateDraft])

	const handleNext = useCallback(() => {
		try {
			validateOnboardingGoalStep({
				goalId: draft.goalId,
				targetCalories: draft.targetCalories,
			})
			setFieldErrors({})
			router.push('/onboarding/step-5')
		} catch (error) {
			setFieldErrors(
				extractFieldErrors(error, ['goalId', 'targetCalories'] as const),
			)
		}
	}, [draft.goalId, draft.targetCalories, router])

	return (
		<YStack w="100%" h="100%" alignItems="center" justifyContent="space-between" p="$md" gap="$space.xl" bg="$background">
			<YStack gap="$space.lg" alignItems="center" justifyContent="center" w="100%">
				<YStack gap="$space.xs" alignItems="flex-start">
					<SizableText ff="$heading" fos="$h3" fow="$bold" col="$text">
						Set your nutrition target
					</SizableText>
					<SizableText ff="$body" fos="$md" fow="$medium" col="$textSubtle">
						Choose a calorie target and goal so we can balance your weekly meal plan.
					</SizableText>
				</YStack>
				<YStack w="100%" gap="$xs">
					<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
						Target Calories
					</Label>
					<InputText
						placeholder="2000"
						keyboardType="number-pad"
						value={draft.targetCalories}
						onChangeText={handleTargetCaloriesChange}
						errorMessage={fieldErrors.targetCalories}
					/>
				</YStack>
				<YStack w="100%" gap="$xs">
					<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
						Goal
					</Label>
					{optionsError ? (
						<YStack w="100%" gap="$space.sm">
							<SizableText ff="$body" fos="$sm" col="$danger">
								{optionsError}
							</SizableText>
							<Button color="secondary" size="medium" onPress={() => void reloadOptions()}>
								<Button.Text>Retry</Button.Text>
							</Button>
						</YStack>
					) : null}
					<InputSelect
						options={goalOptions}
						placeholder="Select your goal"
						value={draft.goalId == null ? undefined : `${draft.goalId}`}
						disabled={isLoadingOptions}
						onValueChange={handleGoalChange}
						errorMessage={fieldErrors.goalId}
						w="100%"
					/>
				</YStack>
			</YStack>

			<XStack gap="$space.md" w="100%" alignItems="center" justifyContent="flex-end">
				<Button color="secondary" size="large" w={120} onPress={() => router.back()}>
					<Button.Text>Back</Button.Text>
				</Button>
				<Button
					color="primary"
					size="large"
					w={120}
					disabled={isLoadingOptions}
					onPress={handleNext}
				>
					<Button.Text>Next</Button.Text>
				</Button>
			</XStack>
		</YStack>
	)
}
