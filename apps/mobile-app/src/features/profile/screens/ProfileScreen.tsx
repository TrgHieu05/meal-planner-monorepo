import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, ScrollView, Spinner, Text, XStack, YStack, useTheme } from 'tamagui';
import { Pencil } from '@tamagui/lucide-icons-2';

import { fetchProfileScreenData } from '../api/profile.api';
import {
    BASIC_INFO_UI_CONFIG,
    METRICS_UI_CONFIG,
    PREFERENCES_UI_CONFIG,
} from '../constants';
import { InfoItemWrapper } from '../components/InfoItemWrapper';
import type { ProfileScreenData } from '../types';

const EMPTY_PROFILE_DATA: ProfileScreenData = {
    basicInfo: {
        userName: '-',
        email: '-',
        gender: '-',
        dob: null,
    },
    preferences: {
        dietType: null,
        goal: null,
        cuisineTypes: [],
        targetCalories: null,
        activityLevel: null,
        notificationsEnabled: null,
    },
    metrics: {
        weight: null,
        height: null,
        bmi: null,
        bodyFatPercent: null,
        updatedAt: null,
    },
};

const getErrorMessage = (error: unknown) => {
    if (error instanceof Error && error.message.trim()) {
        return error.message;
    }

    return 'Unable to load profile data from backend.';
};

export default function ProfileScreen() {
    const theme = useTheme();
    const [profileData, setProfileData] = useState<ProfileScreenData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadProfile = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage(null);

        try {
            const response = await fetchProfileScreenData();
            setProfileData(response);
        } catch (error) {
            setErrorMessage(getErrorMessage(error));
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadProfile();
    }, [loadProfile]);

    const dataToRender = useMemo(() => profileData ?? EMPTY_PROFILE_DATA, [profileData]);

    return (
        <ScrollView contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: theme.background.val }}>
            <YStack h={200} bg="$softPrimary" bblr="$lg" bbrr="$lg" ai="center" jc="center" br="$radius.xl">
                <Text col="$textPrimary" ff="$heading" fos="$h1" fow="$bold">
                    Kitchen Mind
                </Text>
            </YStack>

            <YStack p="$md" gap="$lg">
                {isLoading ? (
                    <XStack ai="center" gap="$sm">
                        <Spinner size="small" color="$primary" />
                        <Text ff="$body" fos="$sm" fow="$medium" col="#4B5563">
                            Loading profile data...
                        </Text>
                    </XStack>
                ) : null}

                {errorMessage ? (
                    <YStack bg="$softDanger" p="$sm" br="$radius.md" gap="$sm">
                        <Text ff="$body" fos="$sm" fow="$medium" col="$textDanger">
                            {errorMessage}
                        </Text>
                        <Button
                            h="hug"
                            ai="center"
                            jc="center"
                            bg="$danger"
                            py="$sm"
                            px="$md"
                            disabled={isLoading}
                            onPress={loadProfile}
                        >
                            <Text ff="$body" fos="$sm" fow="$medium" col="$textInverse">
                                Retry
                            </Text>
                        </Button>
                    </YStack>
                ) : null}

                <YStack gap="$md">
                    <XStack ai="center" gap="$md" jc="space-between">
                        <Text ff="$heading" fos="$h4" fow="$bold">
                            User Information
                        </Text>
                        <Pencil size={20} color="#00b90f" />
                    </XStack>
                    <InfoItemWrapper userData={dataToRender.basicInfo} config={BASIC_INFO_UI_CONFIG} />
                </YStack>

                <YStack gap="$md">
                    <XStack ai="center" gap="$md" jc="space-between">
                        <Text ff="$heading" fos="$h4" fow="$bold">
                            Preferences
                        </Text>
                        <Pencil size={24} color="#00b90f" />
                    </XStack>
                    <InfoItemWrapper userData={dataToRender.preferences} config={PREFERENCES_UI_CONFIG} />
                </YStack>

                <YStack gap="$md">
                    <XStack ai="center" gap="$md" jc="space-between">
                        <Text ff="$heading" fos="$h4" fow="$bold">
                            Health Metrics
                        </Text>
                        <Pencil size={24} color="#00b90f" />
                    </XStack>
                    <InfoItemWrapper userData={dataToRender.metrics} config={METRICS_UI_CONFIG} />
                </YStack>
            </YStack>
        </ScrollView>
    );
}