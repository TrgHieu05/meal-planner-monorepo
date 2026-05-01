import { useState } from 'react'
import { useRouter } from 'expo-router'
import { SizableText, XStack, YStack } from 'tamagui'

import { Button, InputSelect } from '@components'

export default function OnboardingCuisineTypeScreen() {
	const router = useRouter()
	const [selectedCuisine, setSelectedCuisine] = useState<string>('')
	const cuisines = ['Vietnamese', 'Italia', 'Chinese']

	return (
		<YStack w="100%" h="100%" p="$md" alignItems="center" justifyContent="space-between" py="$md" gap="$space.xl" bg="$background">
			<YStack gap="$space.lg" alignItems="center">
				<YStack gap="$space.xs" alignItems="flex-start" w="100%">
					<SizableText ff="$heading" fos="$h3" fow="$bold" col="$text">
						Pick your favorite cuisine
					</SizableText>
					<SizableText ff="$body" fos="$md" fow="$medium" col="$textSubtle">
						Choose the cuisine style you enjoy most so we can tailor meal ideas around it.
					</SizableText>
				</YStack>
				<InputSelect
					options={cuisines}
					placeholder="Select your favorite cuisine"
					value={selectedCuisine}
					onValueChange={setSelectedCuisine}
					w="100%"
				/>
			</YStack>

			<XStack gap="$space.md" w="100%" alignItems="center" justifyContent="flex-end">
				<Button color="secondary" size="large" w={120} onPress={() => router.back()}>
					<Button.Text>Back</Button.Text>
				</Button>
				<Button color="primary" size="large" w={120} onPress={() => router.push('/onboarding/step-4')}>
					<Button.Text>Next</Button.Text>
				</Button>
			</XStack>
		</YStack>
	)
}
