import { useMemo } from 'react'
import { useRouter } from 'expo-router'
import { YStack, SizableText, XStack } from 'tamagui'

import { Button, InputDate, InputSelect } from '@components'

import { useOnboardingProfile } from '../onboarding/OnboardingProfileProvider'


export default function OnboardingInfoScreen() {
    const router = useRouter()
    const { draft, updateDraft } = useOnboardingProfile()
    const genderOptions = useMemo(
        () => [
            { label: 'Male', value: 'M' },
            { label: 'Female', value: 'F' },
        ],
        [],
    )
    const canContinue = draft.gender !== null && draft.dateOfBirth !== null


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
                    onValueChange={(value) => updateDraft({ gender: value as 'M' | 'F' })}
                    w="100%"
                />
                <InputDate
                    placeholder="Select your birth date"
                    value={draft.dateOfBirth}
                    onValueChange={(value) => updateDraft({ dateOfBirth: value })}
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
                    onPress={() => router.push('/onboarding/step-2')}
                >
                    <Button.Text>Next</Button.Text>
                </Button>
            </XStack>
            
        </YStack>
    )
}