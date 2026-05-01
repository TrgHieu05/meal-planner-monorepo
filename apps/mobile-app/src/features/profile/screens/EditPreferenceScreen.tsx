import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft } from '@tamagui/lucide-icons-2'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Label, SizableText, XStack, YStack, useTheme } from 'tamagui'

import { Button, InputSelect, InputText } from '@components'

import {
	createProfilePreferences,
	fetchProfileOptions,
	fetchProfileOverview,
	updateProfilePreferences,
	type ProfileOptions,
} from '../api/profile.api'
import {
	ACTIVITY_LEVEL_OPTIONS,
	resolveApiErrorMessage,
} from '../utils/profile-form'

import { useSession } from '@/providers/AuthProvider'

export default function EditPreferenceScreen() {
	const router = useRouter()
	const theme = useTheme()
	const { session } = useSession()
	const [dietTypeId, setDietTypeId] = useState<string | undefined>()
	const [goalId, setGoalId] = useState<string | undefined>()
	const [cuisineTypeId, setCuisineTypeId] = useState<string | undefined>()
	const [targetCalories, setTargetCalories] = useState('')
	const [activityLevel, setActivityLevel] = useState<string | undefined>()
	const [options, setOptions] = useState<ProfileOptions>({
		dietTypes: [],
		goals: [],
		cuisineTypes: [],
	})
	const [hasExistingProfile, setHasExistingProfile] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [formError, setFormError] = useState<string | null>(null)

	const loadPreferenceData = useCallback(async () => {
		if (!session?.accessToken) {
			setFormError('Missing access token. Please sign in again.')
			setIsLoading(false)
			return
		}

		setIsLoading(true)
		setFormError(null)

		try {
			const [profileOptions, overview] = await Promise.all([
				fetchProfileOptions(),
				fetchProfileOverview({ accessToken: session.accessToken }),
			])

			setOptions(profileOptions)
			setHasExistingProfile(overview.preferences != null)
			setDietTypeId(
				overview.preferences?.dietTypeId == null
					? undefined
					: `${overview.preferences.dietTypeId}`,
			)
			setGoalId(
				overview.preferences?.goalId == null ? undefined : `${overview.preferences.goalId}`,
			)
			setCuisineTypeId(
				overview.preferences?.cuisineTypeId == null
					? undefined
					: `${overview.preferences.cuisineTypeId}`,
			)
			setTargetCalories(
				overview.preferences?.targetCalories == null
					? ''
					: `${overview.preferences.targetCalories}`,
			)
			setActivityLevel(overview.preferences?.activityLevel ?? undefined)
		} catch (error) {
			setFormError(resolveApiErrorMessage(error, 'Unable to load profile preferences.'))
		} finally {
			setIsLoading(false)
		}
	}, [session?.accessToken])

	useEffect(() => {
		void loadPreferenceData()
	}, [loadPreferenceData])

	const handleSave = useCallback(async () => {
		if (!session?.accessToken) {
			setFormError('Missing access token. Please sign in again.')
			return
		}

		if (!dietTypeId || !goalId || !cuisineTypeId) {
			setFormError('Please select diet type, goal, and cuisine type.')
			return
		}

		setIsSaving(true)
		setFormError(null)

		const payload = {
			dietTypeId: Number.parseInt(dietTypeId, 10),
			goalId: Number.parseInt(goalId, 10),
			cuisineTypeId: Number.parseInt(cuisineTypeId, 10),
			targetCalories: targetCalories.trim() ? Number(targetCalories.trim()) : null,
			activityLevel: activityLevel as 'HIGH' | 'AVERAGE' | 'LOW' | undefined,
		}

		try {
			if (hasExistingProfile) {
				await updateProfilePreferences({
					accessToken: session.accessToken,
					payload,
				})
			} else {
				await createProfilePreferences({
					accessToken: session.accessToken,
					payload,
				})
			}

			router.back()
		} catch (error) {
			setFormError(resolveApiErrorMessage(error, 'Unable to update profile preferences.'))
		} finally {
			setIsSaving(false)
		}
	}, [
		activityLevel,
		cuisineTypeId,
		dietTypeId,
		goalId,
		hasExistingProfile,
		router,
		session?.accessToken,
		targetCalories,
	])

	if (isLoading) {
		return (
			<SafeAreaView style={[{ flex: 1 }, { backgroundColor: theme.background.val }]}> 
				<YStack f={1} bg="$background" ai="center" jc="center" px="$md" gap="$sm">
					<SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
						Loading preferences
					</SizableText>
				</YStack>
			</SafeAreaView>
		)
	}

	const dietOptions = options.dietTypes.map((dietType) => ({
		label: dietType.name,
		value: `${dietType.id}`,
	}))
	const goalOptions = options.goals.map((goal) => ({
		label: goal.name,
		value: `${goal.id}`,
	}))
	const cuisineOptions = options.cuisineTypes.map((cuisineType) => ({
		label: cuisineType.name,
		value: `${cuisineType.id}`,
	}))

	return (
		<SafeAreaView style={[{ flex: 1 }, { backgroundColor: theme.background.val }]}>
			<YStack f={1} bg="$background" jc="space-between">
				<YStack px="$md" pt="$md" gap="$lg">
					<XStack h={40} ai="center" jc="center" pos="relative">
						<XStack pos="absolute" l={0} p="$xs" onPress={() => router.back()} pressStyle={{ opacity: 0.7 }}>
							<ChevronLeft color={theme.text.val} size={24} />
						</XStack>
						<SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
							Edit Preferences & Rules
						</SizableText>
					</XStack>

					<YStack w="100%" gap="$md">
						<YStack w="100%" gap="$xs">
							<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
								Diet Type
							</Label>
							<InputSelect options={dietOptions} value={dietTypeId} onValueChange={setDietTypeId} w="100%" />
						</YStack>

						<YStack w="100%" gap="$xs">
							<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
								Goal
							</Label>
							<InputSelect options={goalOptions} value={goalId} onValueChange={setGoalId} w="100%" />
						</YStack>

						<YStack w="100%" gap="$xs">
							<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
								Cuisine Type
							</Label>
							<InputSelect
								options={cuisineOptions}
								value={cuisineTypeId}
								onValueChange={setCuisineTypeId}
								w="100%"
							/>
						</YStack>

						<YStack w="100%" gap="$xs">
							<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
								Target Calories
							</Label>
							<InputText value={targetCalories} onChangeText={setTargetCalories} keyboardType="number-pad" />
						</YStack>

						<YStack w="100%" gap="$xs">
							<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
								Activity Level
							</Label>
							<InputSelect
								options={ACTIVITY_LEVEL_OPTIONS}
								value={activityLevel}
								onValueChange={setActivityLevel}
								w="100%"
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