import { useRouter } from 'expo-router'
import { SizableText, XStack, YStack } from 'tamagui'

import { Button, InputSelect } from '@components'

import { useOnboardingProfile } from '../onboarding/OnboardingProfileProvider'

export default function OnboardingCuisineTypeScreen() {
	const router = useRouter()
	const { draft, options, isLoadingOptions, optionsError, reloadOptions, updateDraft } =
		useOnboardingProfile()
	const canContinue = draft.cuisineTypeId !== null && !isLoadingOptions
	const cuisineOptions = options.cuisineTypes.map((cuisineType) => ({
		label: cuisineType.name,
		value: `${cuisineType.id}`,
	}))

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
					options={cuisineOptions}
					placeholder="Select your favorite cuisine"
					value={draft.cuisineTypeId == null ? undefined : `${draft.cuisineTypeId}`}
					disabled={isLoadingOptions}
					onValueChange={(value) =>
						updateDraft({ cuisineTypeId: Number.parseInt(value, 10) })
					}
					w="100%"
				/>
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
					onPress={() => router.push('/onboarding/step-4')}
				>
					<Button.Text>Next</Button.Text>
				</Button>
			</XStack>
		</YStack>
	)
}
