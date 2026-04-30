import { YStack, SizableText, XStack} from 'tamagui'
import { Button } from '@components'
import { useState } from 'react'
import { useRouter } from 'expo-router'
import { InputDate, InputSelect } from '@components'


export default function OnboardingInfoScreen() {
    const router = useRouter();
    const genders = ["Male", "Female"];
    const [selectedGender, setSelectedGender] = useState<string>()
    const [selectedBirthDate, setSelectedBirthDate] = useState<Date>()


    return (
        <YStack w="100%" h="100%" p="$md" alignItems="center" justifyContent="space-between" py="$md" gap="$space.xl" bg="$background">
            <YStack gap="$space.lg" alignItems="center">
                <YStack gap="$space.xs" alignItems="flex-start">
                    <SizableText ff="$heading" fos="$h3" fow="$bold" col="$text">Tell us about yourself</SizableText>
                    <SizableText ff="$body" fos="$md" fow="$medium" col="$textSubtle" >We only need a few basics to personalize your meal plan and recommendations.</SizableText>
                </YStack>
                <InputSelect
                    options={genders}
                    placeholder="Select your gender"
                    value={selectedGender}
                    onValueChange={setSelectedGender}
                    w="100%"
                />
                <InputDate
                    placeholder="Select your birth date"
                    value={selectedBirthDate}
                    onValueChange={setSelectedBirthDate}
                    w="100%"
                />
            </YStack>

            <XStack gap="$space.md" w="100%" alignItems="center" justifyContent="flex-end">
                <Button color="secondary" size="large" w={120} onPress={() => router.back()}>
                    <Button.Text>Back</Button.Text>
                </Button>
                <Button color="primary" size="large" w={120} onPress={() => router.push('/onboarding/step-2')}>
                    <Button.Text>Next</Button.Text>
                </Button>
            </XStack>
            
        </YStack>
    )
}