import { useCallback, useState } from 'react'
import { useRouter } from 'expo-router'
import { SizableText, XStack, YStack } from 'tamagui'

import { Button, InputSelect } from '@components'

import { useOnboardingProfile } from '../onboarding/OnboardingProfileProvider'
import {
	extractFieldErrors,
	validateOnboardingDietTypeStep,
} from '../utils/profile-form'

export default function OnboardingDietTypeScreen() {
	const router = useRouter()
	const { draft, options, isLoadingOptions, optionsError, reloadOptions, updateDraft } =
		useOnboardingProfile()
	const [fieldErrors, setFieldErrors] = useState<
		Partial<Record<'dietTypeId', string>>
	>({})
	const dietOptions = options.dietTypes.map((dietType) => ({
		label: dietType.name,
		value: `${dietType.id}`,
	}))

	const handleDietTypeChange = useCallback((value: string) => {
		updateDraft({ dietTypeId: Number.parseInt(value, 10) })
		setFieldErrors({ dietTypeId: undefined })
	}, [updateDraft])

	const handleNext = useCallback(() => {
		try {
			validateOnboardingDietTypeStep({
				dietTypeId: draft.dietTypeId,
			})
			setFieldErrors({})
			router.push('/onboarding/step-3')
		} catch (error) {
			setFieldErrors(
				extractFieldErrors(error, ['dietTypeId'] as const),
			)
		}
	}, [draft.dietTypeId, router])

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
					options={dietOptions}
					placeholder="Select your diet type"
					value={draft.dietTypeId == null ? undefined : `${draft.dietTypeId}`}
					disabled={isLoadingOptions}
					onValueChange={handleDietTypeChange}
					errorMessage={fieldErrors.dietTypeId}
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
					disabled={isLoadingOptions}
					onPress={handleNext}
				>
					<Button.Text>Next</Button.Text>
				</Button>
			</XStack>
		</YStack>
	)
}
