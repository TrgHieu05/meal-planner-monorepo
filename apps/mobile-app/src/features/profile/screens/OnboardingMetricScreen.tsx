import { useCallback, useState } from 'react'
import { useRouter } from 'expo-router'
import { Label, SizableText, XStack, YStack } from 'tamagui'

import { Button, InputText } from '@components'

import { useOnboardingProfile } from '../onboarding/OnboardingProfileProvider'
import { extractFieldErrors } from '../utils/profile-form'

export default function OnboardingMetricScreen() {
	const router = useRouter()
	const { draft, updateDraft, isSubmitting, submitError, clearSubmitError, submitOnboarding } =
		useOnboardingProfile()
	const [fieldErrors, setFieldErrors] = useState<
		Partial<Record<'heightCm' | 'weightKg', string>>
	>({})
	const canComplete = !isSubmitting

	const handleWeightChange = useCallback((value: string) => {
		updateDraft({ weightKg: value })
		setFieldErrors((current) => ({
			...current,
			weightKg: undefined,
		}))
	}, [updateDraft])

	const handleHeightChange = useCallback((value: string) => {
		updateDraft({ heightCm: value })
		setFieldErrors((current) => ({
			...current,
			heightCm: undefined,
		}))
	}, [updateDraft])

	const handleComplete = useCallback(async () => {
		clearSubmitError()
		setFieldErrors({})

		try {
			await submitOnboarding()
			router.replace('/')
		} catch (error) {
			setFieldErrors(
				extractFieldErrors(error, ['heightCm', 'weightKg'] as const),
			)
			return
		}
	}, [clearSubmitError, router, submitOnboarding])

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
					<InputText
						placeholder="60.5"
						keyboardType="decimal-pad"
						value={draft.weightKg}
						onChangeText={handleWeightChange}
						errorMessage={fieldErrors.weightKg}
					/>
				</YStack>
				<YStack w="100%" gap="$xs">
					<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
						Height (cm)
					</Label>
					<InputText
						placeholder="160.5"
						keyboardType="decimal-pad"
						value={draft.heightCm}
						onChangeText={handleHeightChange}
						errorMessage={fieldErrors.heightCm}
					/>
				</YStack>
				{submitError ? (
					<SizableText ff="$body" fos="$sm" col="$danger" w="100%">
						{submitError}
					</SizableText>
				) : null}
			</YStack>

			<XStack gap="$space.md" w="100%" alignItems="center" justifyContent="flex-end">
				<Button color="secondary" size="large" w={120} onPress={() => router.back()}>
					<Button.Text>Back</Button.Text>
				</Button>
				<Button
					color="primary"
					size="large"
					w={120}
					disabled={!canComplete}
					onPress={() => void handleComplete()}
				>
					<Button.Text>{isSubmitting ? 'Saving...' : 'Complete'}</Button.Text>
				</Button>
			</XStack>
		</YStack>
	)
}
