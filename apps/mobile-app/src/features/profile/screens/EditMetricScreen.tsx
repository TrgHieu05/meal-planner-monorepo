import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft } from '@tamagui/lucide-icons-2'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Label, SizableText, XStack, YStack, useTheme } from 'tamagui'

import { Button, InputText } from '@components'

import { createMetricEntry, fetchProfileOverview } from '../api/profile.api'
import {
	extractFieldErrors,
	hasFieldErrors,
	resolveApiErrorMessage,
	validateMetricForm,
} from '../utils/profile-form'

import { useSession } from '@/providers/AuthProvider'

export default function EditMetricScreen() {
	const router = useRouter()
	const theme = useTheme()
	const { session } = useSession()
	const [height, setHeight] = useState('')
	const [weight, setWeight] = useState('')
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [formError, setFormError] = useState<string | null>(null)
	const [fieldErrors, setFieldErrors] = useState<
		Partial<Record<'heightCm' | 'weightKg', string>>
	>({})

	const handleHeightChange = useCallback((value: string) => {
		setHeight(value)
		setFieldErrors((current) => ({
			...current,
			heightCm: undefined,
		}))
		setFormError(null)
	}, [])

	const handleWeightChange = useCallback((value: string) => {
		setWeight(value)
		setFieldErrors((current) => ({
			...current,
			weightKg: undefined,
		}))
		setFormError(null)
	}, [])

	const loadMetricData = useCallback(async () => {
		if (!session?.accessToken) {
			setFormError('Missing access token. Please sign in again.')
			setIsLoading(false)
			return
		}

		setIsLoading(true)
		setFormError(null)

		try {
			const overview = await fetchProfileOverview({ accessToken: session.accessToken })
			setHeight(
				overview.latestMetric?.heightCm == null ? '' : `${overview.latestMetric.heightCm}`,
			)
			setWeight(
				overview.latestMetric?.weightKg == null ? '' : `${overview.latestMetric.weightKg}`,
			)
		} catch (error) {
			setFormError(resolveApiErrorMessage(error, 'Unable to load metric data.'))
		} finally {
			setIsLoading(false)
		}
	}, [session?.accessToken])

	useEffect(() => {
		void loadMetricData()
	}, [loadMetricData])

	const handleSave = useCallback(async () => {
		if (!session?.accessToken) {
			setFormError('Missing access token. Please sign in again.')
			return
		}

		setFieldErrors({})
		setFormError(null)

		let payload: ReturnType<typeof validateMetricForm>
		try {
			payload = validateMetricForm({
				heightCm: height,
				weightKg: weight,
			})
		} catch (error) {
			const nextFieldErrors = extractFieldErrors(
				error,
				['heightCm', 'weightKg'] as const,
			)
			setFieldErrors(nextFieldErrors)
			setFormError(
				hasFieldErrors(nextFieldErrors)
					? null
					: resolveApiErrorMessage(
							error,
							'Please review the highlighted fields.',
					  ),
			)
			return
		}

		setIsSaving(true)

		try {
			await createMetricEntry({
				accessToken: session.accessToken,
				payload,
			})
			router.back()
		} catch (error) {
			const nextFieldErrors = extractFieldErrors(
				error,
				['heightCm', 'weightKg'] as const,
			)
			setFieldErrors(nextFieldErrors)
			setFormError(
				hasFieldErrors(nextFieldErrors)
					? null
					: resolveApiErrorMessage(
							error,
							'Unable to update metric data right now.',
					  ),
			)
		} finally {
			setIsSaving(false)
		}
	}, [height, router, session?.accessToken, weight])

	if (isLoading) {
		return (
			<SafeAreaView style={[{ flex: 1 }, { backgroundColor: theme.background.val }]}> 
				<YStack f={1} bg="$background" ai="center" jc="center" px="$md" gap="$sm">
					<SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
						Loading metrics
					</SizableText>
				</YStack>
			</SafeAreaView>
		)
	}

	return (
		<SafeAreaView style={[{ flex: 1 }, { backgroundColor: theme.background.val }]}>
			<YStack f={1} bg="$background" jc="space-between">
				<YStack px="$md" pt="$md" gap="$lg">
					<XStack h={40} ai="center" jc="center" pos="relative">
						<XStack pos="absolute" l={0} p="$xs" onPress={() => router.back()} pressStyle={{ opacity: 0.7 }}>
							<ChevronLeft color={theme.text.val} size={24} />
						</XStack>
						<SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
							Edit Metric
						</SizableText>
					</XStack>

					<YStack w="100%" gap="$md">
						<YStack w="100%" gap="$xs">
							<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
								Height (cm)
							</Label>
							<InputText
								value={height}
								onChangeText={handleHeightChange}
								keyboardType="decimal-pad"
								errorMessage={fieldErrors.heightCm}
							/>
						</YStack>

						<YStack w="100%" gap="$xs">
							<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
								Weight (kg)
							</Label>
							<InputText
								value={weight}
								onChangeText={handleWeightChange}
								keyboardType="decimal-pad"
								errorMessage={fieldErrors.weightKg}
							/>
						</YStack>

						{formError ? (
							<SizableText ff="$body" fos="$sm" col="$danger">
								{formError}
							</SizableText>
						) : null}
					</YStack>
				</YStack>

				<YStack px="$md" pb="$lg">
					<Button color="primary" size="large" disabled={isSaving} onPress={() => void handleSave()}>
						<Button.Text>{isSaving ? 'Saving...' : 'Save changes'}</Button.Text>
					</Button>
				</YStack>
			</YStack>
		</SafeAreaView>
	)
}