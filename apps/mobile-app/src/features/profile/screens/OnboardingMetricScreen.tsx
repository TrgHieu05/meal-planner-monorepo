import { useRouter } from 'expo-router'
import { Label, SizableText, XStack, YStack } from 'tamagui'

import { Button, InputText } from '@components'

export default function OnboardingMetricScreen() {
	const router = useRouter()

	return (
		<YStack w="100%" h="100%" p="$md" alignItems="center" justifyContent="space-between" py="$md" gap="$space.xl" bg="$background">
			<YStack gap="$space.lg" alignItems="center" justifyContent="center" w="100%">
				<YStack gap="$space.xs" alignItems="flex-start">
					<SizableText ff="$heading" fos="$h3" fow="$bold" col="$text">
						Add your body metrics
					</SizableText>
					<SizableText ff="$body" fos="$md" fow="$medium" col="$textSubtle">
						Height and weight help us calibrate portions and nutrition estimates.
					</SizableText>
				</YStack>
				<YStack w="100%" gap="$xs">
					<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
						Weight (kg)
					</Label>
					<InputText placeholder="60.5" keyboardType="number-pad" />
				</YStack>
				<YStack w="100%" gap="$xs">
					<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
						Height (cm)
					</Label>
					<InputText placeholder="160.5" keyboardType="number-pad" />
				</YStack>
			</YStack>

			<XStack gap="$space.md" w="100%" alignItems="center" justifyContent="flex-end">
				<Button color="secondary" size="large" w={120} onPress={() => router.back()}>
					<Button.Text>Back</Button.Text>
				</Button>
				<Button color="primary" size="large" w={120} onPress={() => router.dismissTo('/')}>
					<Button.Text>Complete</Button.Text>
				</Button>
			</XStack>
		</YStack>
	)
}
