import { useState } from 'react'
import { useRouter } from 'expo-router'
import { Label, SizableText, XStack, YStack } from 'tamagui'

import { Button, InputSelect, InputText } from '@components'

export default function OnboardingGoalScreen() {
	const goals = ['Lose Weight', 'Maintain Weight', 'Gain Muscle']
	const [selectedGoal, setSelectedGoal] = useState<string>()
	const router = useRouter()

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
					<InputText placeholder="2000" keyboardType="number-pad" />
				</YStack>
				<YStack w="100%" gap="$xs">
					<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
						Goal
					</Label>
					<InputSelect
						options={goals}
						placeholder="Select your diet type"
						value={selectedGoal}
						onValueChange={setSelectedGoal}
						w="100%"
					/>
				</YStack>
			</YStack>

			<XStack gap="$space.md" w="100%" alignItems="center" justifyContent="flex-end">
				<Button color="secondary" size="large" w={120} onPress={() => router.back()}>
					<Button.Text>Back</Button.Text>
				</Button>
				<Button color="primary" size="large" w={120} onPress={() => router.push('/onboarding/step-5')}>
					<Button.Text>Next</Button.Text>
				</Button>
			</XStack>
		</YStack>
	)
}
