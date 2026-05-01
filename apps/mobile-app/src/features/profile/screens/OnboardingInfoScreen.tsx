import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'expo-router'
import { YStack, SizableText, XStack } from 'tamagui'

import { Button, InputDate, InputSelect } from '@components'

import { useOnboardingProfile } from '../onboarding/OnboardingProfileProvider'
import {
    extractFieldErrors,
    validateOnboardingInfoStep,
} from '../utils/profile-form'

import { useSession } from '@/providers/AuthProvider'


export default function OnboardingInfoScreen() {
    const router = useRouter()
    const { signOut } = useSession()
    const { draft, updateDraft } = useOnboardingProfile()
    const [fieldErrors, setFieldErrors] = useState<
        Partial<Record<'gender' | 'dateOfBirth', string>>
    >({})
    const genderOptions = useMemo(
        () => [
            { label: 'Male', value: 'M' },
            { label: 'Female', value: 'F' },
        ],
        [],
    )
    const handleBackToLogin = useCallback(async () => {
        await signOut()
        router.replace('/login')
    }, [router, signOut])

    const handleGenderChange = useCallback((value: string) => {
        updateDraft({ gender: value as 'M' | 'F' })
        setFieldErrors((current) => ({
            ...current,
            gender: undefined,
        }))
    }, [updateDraft])

    const handleDateOfBirthChange = useCallback((value: Date) => {
        updateDraft({ dateOfBirth: value })
        setFieldErrors((current) => ({
            ...current,
            dateOfBirth: undefined,
        }))
    }, [updateDraft])

    const handleNext = useCallback(() => {
        try {
            validateOnboardingInfoStep({
                gender: draft.gender,
                dateOfBirth: draft.dateOfBirth,
            })
            setFieldErrors({})
            router.push('/onboarding/step-2')
        } catch (error) {
            setFieldErrors(
                extractFieldErrors(error, ['gender', 'dateOfBirth'] as const),
            )
        }
    }, [draft.dateOfBirth, draft.gender, router])


    return (
        <YStack w="100%" h="100%" p="$md" alignItems="center" justifyContent="space-between" py="$md" gap="$space.xl" bg="$background">
            <YStack gap="$space.lg" alignItems="center">
                <YStack gap="$space.xs" alignItems="flex-start">
                    <SizableText ff="$heading" fos="$h3" fow="$bold" col="$text">Tell us about yourself</SizableText>
                    <SizableText ff="$body" fos="$md" fow="$medium" col="$textSubtle" >We only need a few basics to personalize your meal plan and recommendations.</SizableText>
                </YStack>
                <InputSelect
                    options={genderOptions}
                    placeholder="Select your gender"
                    value={draft.gender ?? undefined}
                    onValueChange={handleGenderChange}
                    errorMessage={fieldErrors.gender}
                    w="100%"
                />
                <InputDate
                    placeholder="Select your birth date"
                    value={draft.dateOfBirth}
                    onValueChange={handleDateOfBirthChange}
                    errorMessage={fieldErrors.dateOfBirth}
                    w="100%"
                />
            </YStack>

            <XStack gap="$space.md" w="100%" alignItems="center" justifyContent="flex-end">
                <Button
                    color="secondary"
                    size="large"
                    w={120}
                    onPress={() => void handleBackToLogin()}
                >
                    <Button.Text>Back</Button.Text>
                </Button>
                <Button
                    color="primary"
                    size="large"
                    w={120}
                    onPress={handleNext}
                >
                    <Button.Text>Next</Button.Text>
                </Button>
            </XStack>
            
        </YStack>
    )
}