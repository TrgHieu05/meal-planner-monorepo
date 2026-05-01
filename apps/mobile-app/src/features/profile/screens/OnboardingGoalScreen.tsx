import { useRouter } from 'expo-router'
import { Label, SizableText, XStack, YStack } from 'tamagui'

import { Button, InputSelect, InputText } from '@components'

import { useOnboardingProfile } from '../onboarding/OnboardingProfileProvider'

export default function OnboardingGoalScreen() {
	const router = useRouter()
	const { draft, options, isLoadingOptions, optionsError, reloadOptions, updateDraft } =
		useOnboardingProfile()
	const canContinue = draft.goalId !== null && !isLoadingOptions
	const goalOptions = options.goals.map((goal) => ({
		label: goal.name,
		value: `${goal.id}`,
	}))

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
						onChangeText={(value) => updateDraft({ targetCalories: value })}
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
						onValueChange={(value) =>
							updateDraft({ goalId: Number.parseInt(value, 10) })
						}
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
					disabled={!canContinue}
					onPress={() => router.push('/onboarding/step-5')}
				>
					<Button.Text>Next</Button.Text>
				</Button>
			</XStack>
		</YStack>
	)
}
