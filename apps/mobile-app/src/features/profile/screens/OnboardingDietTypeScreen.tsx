import { useState } from 'react'
import { useRouter } from 'expo-router'
import { SizableText, XStack, YStack } from 'tamagui'

import { Button, InputSelect } from '@components'

export default function OnboardingDietTypeScreen() {
	const router = useRouter()
	const [selectedDietType, setSelectedDietType] = useState<string>()
	const labels = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry', 'Fig', 'Grape', 'Honeydew']

	return (
		<YStack w="100%" h="100%" p="$md" alignItems="center" justifyContent="space-between" py="$md" gap="$space.xl" bg="$background">
			<YStack gap="$space.lg" alignItems="center">
				<YStack gap="$space.xs" alignItems="flex-start" w="100%">
					<SizableText ff="$heading" fos="$h3" fow="$bold" col="$text">
						Choose your diet type
					</SizableText>
					<SizableText ff="$body" fos="$md" fow="$medium" col="$textSubtle">
						Pick the diet pattern you want us to prioritize in your meal suggestions.
					</SizableText>
				</YStack>
				<InputSelect
					options={labels}
					placeholder="Select your diet type"
					value={selectedDietType}
					onValueChange={setSelectedDietType}
					w="100%"
				/>
			</YStack>

			<XStack gap="$space.md" w="100%" alignItems="center" justifyContent="flex-end">
				<Button color="secondary" size="large" w={120} onPress={() => router.back()}>
					<Button.Text>Back</Button.Text>
				</Button>
				<Button color="primary" size="large" w={120} onPress={() => router.push('/onboarding/step-3')}>
					<Button.Text>Next</Button.Text>
				</Button>
			</XStack>
		</YStack>
	)
}
