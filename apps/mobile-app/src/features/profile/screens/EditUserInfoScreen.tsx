import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft } from '@tamagui/lucide-icons-2'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Label, SizableText, XStack, YStack, useTheme } from 'tamagui'

import { Button, InputDate, InputSelect, InputText } from '@components'

import { fetchProfileOverview, updateCurrentUser } from '../api/profile.api'
import {
	extractFieldErrors,
	GENDER_OPTIONS,
	hasFieldErrors,
	resolveApiErrorMessage,
	validateUserInfoForm,
} from '../utils/profile-form'

import { useSession } from '@/providers/AuthProvider'

export default function EditUserInfoScreen() {
	const router = useRouter()
	const theme = useTheme()
	const { session } = useSession()
	const [fullName, setFullName] = useState('')
	const [gender, setGender] = useState<string | undefined>()
	const [birthDate, setBirthDate] = useState<Date | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [formError, setFormError] = useState<string | null>(null)
	const [fieldErrors, setFieldErrors] = useState<
		Partial<Record<'userName' | 'gender' | 'dateOfBirth', string>>
	>({})

	const handleFullNameChange = useCallback((value: string) => {
		setFullName(value)
		setFieldErrors((current) => ({
			...current,
			userName: undefined,
		}))
		setFormError(null)
	}, [])

	const handleGenderChange = useCallback((value: string) => {
		setGender(value)
		setFieldErrors((current) => ({
			...current,
			gender: undefined,
		}))
		setFormError(null)
	}, [])

	const handleBirthDateChange = useCallback((value: Date) => {
		setBirthDate(value)
		setFieldErrors((current) => ({
			...current,
			dateOfBirth: undefined,
		}))
		setFormError(null)
	}, [])

	const loadUserProfile = useCallback(async () => {
		if (!session?.accessToken) {
			setFormError('Missing access token. Please sign in again.')
			setIsLoading(false)
			return
		}

		setIsLoading(true)
		setFormError(null)

		try {
			const overview = await fetchProfileOverview({ accessToken: session.accessToken })
			setFullName(overview.basic.userName)
			setGender(overview.basic.gender ?? undefined)
			setBirthDate(overview.basic.dateOfBirth)
		} catch (error) {
			setFormError(resolveApiErrorMessage(error, 'Unable to load user information.'))
		} finally {
			setIsLoading(false)
		}
	}, [session?.accessToken])

	useEffect(() => {
		void loadUserProfile()
	}, [loadUserProfile])

	const handleSave = useCallback(async () => {
		if (!session?.accessToken) {
			setFormError('Missing access token. Please sign in again.')
			return
		}

		setFieldErrors({})
		setFormError(null)

		let payload: ReturnType<typeof validateUserInfoForm>
		try {
			payload = validateUserInfoForm({
				userName: fullName,
				gender: gender as 'M' | 'F' | undefined,
				dateOfBirth: birthDate,
			})
			setFullName(payload.userName)
		} catch (error) {
			const nextFieldErrors = extractFieldErrors(
				error,
				['userName', 'gender', 'dateOfBirth'] as const,
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
			await updateCurrentUser({
				accessToken: session.accessToken,
				payload,
			})
			router.back()
		} catch (error) {
			const nextFieldErrors = extractFieldErrors(
				error,
				['userName', 'gender', 'dateOfBirth'] as const,
			)
			setFieldErrors(nextFieldErrors)
			setFormError(
				hasFieldErrors(nextFieldErrors)
					? null
					: resolveApiErrorMessage(
							error,
							'Unable to update user information right now.',
					  ),
			)
		} finally {
			setIsSaving(false)
		}
	}, [birthDate, fullName, gender, router, session?.accessToken])

	if (isLoading) {
		return (
			<SafeAreaView style={[{ flex: 1 }, { backgroundColor: theme.background.val }]}> 
				<YStack f={1} bg="$background" ai="center" jc="center" px="$md" gap="$sm">
					<SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
						Loading user information
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
							Edit User Information
						</SizableText>
					</XStack>

					<YStack w="100%" gap="$md">
						<YStack w="100%" gap="$xs">
							<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
								Full Name
							</Label>
							<InputText
								value={fullName}
								onChangeText={handleFullNameChange}
								errorMessage={fieldErrors.userName}
							/>
						</YStack>

						<YStack w="100%" gap="$xs">
							<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
								Gender
							</Label>
							<InputSelect
								options={GENDER_OPTIONS}
								value={gender}
								onValueChange={handleGenderChange}
								errorMessage={fieldErrors.gender}
								w="100%"
							/>
						</YStack>

						<YStack w="100%" gap="$xs">
							<Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
								Date of Birth
							</Label>
							<InputDate
								value={birthDate}
								onValueChange={handleBirthDateChange}
								errorMessage={fieldErrors.dateOfBirth}
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