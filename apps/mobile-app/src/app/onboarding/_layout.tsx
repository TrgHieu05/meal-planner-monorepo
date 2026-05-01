import { YStack, Progress, useTheme, SizableText } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, usePathname } from 'expo-router';

import { OnboardingProfileProvider } from '@features/profile/onboarding/OnboardingProfileProvider';

const ONBOARDING_STEPS = [
  "/onboarding/step-1",
  "/onboarding/step-2",
  "/onboarding/step-3",
  "/onboarding/step-4",
  "/onboarding/step-5",
];

export default function OnboardingLayout() {

    const pathname = usePathname();
  
    // Tìm index của trang hiện tại để tính %
    const currentStepIndex = ONBOARDING_STEPS.indexOf(pathname) + 1;
    const progress = currentStepIndex !== 0 ? ((currentStepIndex) / ONBOARDING_STEPS.length) * 100 : 0;
    const theme = useTheme();
    
    return (
        <OnboardingProfileProvider>
            <SafeAreaView style={[{ flex: 1 }, { backgroundColor: theme.background.val }]}>
                <YStack f={1}>
                    <YStack w="100%" h={64} gap="$space.sm" p="$space.md">
                        <SizableText ff="$body" fos="$md" fow="$semiBold" col="$textSubtle">Step {currentStepIndex} of 5</SizableText>
                        <Progress value={progress} h={12} w="100%" bg="$surface">
                            <Progress.Indicator bg="$primary" borderRadius="$pill"/>
                        </Progress>
                    </YStack>

                    <YStack f={1} w="100%">
                        <Stack screenOptions={{ headerShown: false }}>
                            <Stack.Screen name="step-1" />
                            <Stack.Screen name="step-2" />
                            <Stack.Screen name="step-3" />
                            <Stack.Screen name="step-4" />
                            <Stack.Screen name="step-5" />
                        </Stack>
                    </YStack>
                </YStack>
            </SafeAreaView>
        </OnboardingProfileProvider>
    )
}

