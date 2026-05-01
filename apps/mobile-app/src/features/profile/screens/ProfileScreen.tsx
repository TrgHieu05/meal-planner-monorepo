import { useCallback, useState } from 'react';
import { Link } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, SizableText, XStack, YStack, View } from 'tamagui';
import { 
    Space, Mail, Mars, Venus, Calendar,
    Utensils, Goal, Earth, Flame, Footprints,
    Ruler, Dumbbell, Percent,
    Pencil, Settings
} from '@tamagui/lucide-icons-2';

import { Tag } from '@components';

import { fetchProfileScreenData } from '../api/profile.api';
import { InfoItem } from '../components/InfoItem';

import { useSession } from '@/providers/AuthProvider';

import type { ProfileScreenData } from '../types';

export default function ProfileScreen() {
    const { session } = useSession();
    const [profileData, setProfileData] = useState<ProfileScreenData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const loadProfileData = useCallback(async () => {
        if (!session?.accessToken) {
            setProfileData(null);
            setErrorMessage('Missing access token. Please sign in again.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setErrorMessage(null);

        try {
            const nextProfileData = await fetchProfileScreenData({
                accessToken: session.accessToken,
            });
            setProfileData(nextProfileData);
        } catch (error) {
            setProfileData(null);
            setErrorMessage(
                error instanceof Error && error.message.trim()
                    ? error.message.trim()
                    : 'Unable to load your profile right now.',
            );
        } finally {
            setIsLoading(false);
        }
    }, [session?.accessToken]);

    useFocusEffect(useCallback(() => {
        void loadProfileData();
    }, [loadProfileData]));

    if (isLoading) {
        return (
            <YStack f={1} bg="$background" ai="center" jc="center" px="$md" gap="$sm">
                <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                    Loading profile
                </SizableText>
                <SizableText ff="$body" fos="$md" col="$textSubtle" ta="center">
                    Fetching your latest profile details from the server.
                </SizableText>
            </YStack>
        );
    }

    if (errorMessage) {
        return (
            <YStack f={1} bg="$background" ai="center" jc="center" px="$md" gap="$md">
                <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                    Unable to load profile
                </SizableText>
                <SizableText ff="$body" fos="$md" col="$danger" ta="center">
                    {errorMessage}
                </SizableText>
                <XStack onPress={() => void loadProfileData()} px="$md" py="$sm" bg="$surface" br="$pill">
                    <SizableText ff="$body" fos="$md" fow="$semiBold" col="$text">
                        Retry
                    </SizableText>
                </XStack>
            </YStack>
        );
    }

    if (!profileData) {
        return null;
    }

    if (profileData.isProfileIncomplete) {
        return (
            <YStack f={1} bg="$background" ai="center" jc="center" px="$md" gap="$sm">
                <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text" ta="center">
                    Your profile is not complete yet
                </SizableText>
                <SizableText ff="$body" fos="$md" col="$textSubtle" ta="center">
                    Finish filling in your profile details so this screen can show your saved preferences and metrics.
                </SizableText>
            </YStack>
        );
    }

    const genderIcon = profileData.basicInfo.gender === 'Female' ? Venus : Mars;
    const dateOfBirthLabel = profileData.basicInfo.dob
        ? profileData.basicInfo.dob.toLocaleDateString('en-CA')
        : 'Not set';
    const targetCaloriesLabel =
        profileData.preferences.targetCalories == null
            ? 'Not set'
            : `${profileData.preferences.targetCalories} kcal/day`;
    const metricWeightLabel =
        profileData.metrics.weight == null ? 'Not set' : `${profileData.metrics.weight} kg`;
    const metricHeightLabel =
        profileData.metrics.height == null ? 'Not set' : `${profileData.metrics.height} cm`;
    const metricBmiLabel =
        profileData.metrics.bmi == null ? 'Not set' : `${profileData.metrics.bmi}`;

    return (
        <ScrollView contentInsetAdjustmentBehavior="automatic">
            <YStack f={1} bg="$background">
                <YStack h={200} bg="$softPrimary" bblr="$lg" bbrr="$lg" ai="center" jc="center" overflow="hidden" position="relative">
                    <View h={120} w={120} bw={2} borderColor="$primary" br="$radius.pill" bg="$surface">
                        <XStack h={40} w={40} br="$radius.pill" bg="$background" ai="center" jc="center"  position='absolute' bottom={-8} right={-8} >
                            <Pencil size={20} col="$primary"/>
                        </XStack>
                    </View>
                    <View br="$radius.pill" bg="$color.jade4" opacity={0.5} h={120} w={120} position='absolute' left={-50} bottom={-20}></View>
                    <View br="$radius.pill" bg="$color.jade5" opacity={0.5} h={120} w={120} position='absolute' left={20} bottom={-60}></View>
                    <View br="$radius.pill" bg="$color.jade6" opacity={0.5} h={90} w={90} position='absolute' right={20} top={-60}></View>
                    <View br="$radius.pill" bg="$color.jade5" opacity={0.7} h={120} w={120} position='absolute' right={-40} top={-40}></View>

                    <XStack h={40} w={40} br="$radius.pill" bg="$primary"  ai="center" jc="center"  position='absolute' bottom={16} right={16} >
                        <Settings size={24} col="$textInverse"/>
                    </XStack>
                </YStack>

                <YStack gap="$space.xl" p="$space.md">
                    <YStack gap="$space.xs">
                        <XStack ai="center" jc="space-between">
                            <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                                User Information
                            </SizableText>
                            <Link href="/profile/edit-user-info" asChild>
                                <XStack p="$xs" pressStyle={{ opacity: 0.7 }}>
                                    <Pencil size={20} col="$textPrimary" />
                                </XStack>
                            </Link>
                        </XStack>
                        <YStack br="$radius.md" bg="$surface" overflow="hidden">
                            <InfoItem label="Username" value={profileData.basicInfo.userName} Icon={Space} />
                            <InfoItem label="Email" value={profileData.basicInfo.email} Icon={Mail} />
                            <InfoItem label="Gender" value={profileData.basicInfo.gender ?? 'Not set'} Icon={genderIcon} />
                            <InfoItem label="Date of Birth" value={dateOfBirthLabel} Icon={Calendar} isLast/>
                        </YStack>
                    </YStack>

                    <YStack gap="$space.xs">
                        <XStack ai="center" jc="space-between">
                            <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                                Preferences & Rules
                            </SizableText>
                            <Link href="/profile/edit-preference" asChild>
                                <XStack p="$xs" pressStyle={{ opacity: 0.7 }}>
                                    <Pencil size={20} col="$textPrimary" />
                                </XStack>
                            </Link>
                        </XStack>
                        <YStack br="$radius.md" bg="$surface" overflow="hidden">
                            <InfoItem label="Diet Type" value={profileData.preferences.dietType ?? 'Not set'} Icon={Utensils} />
                            <InfoItem label="Goal" value={profileData.preferences.goal ?? 'Not set'} Icon={Goal} />
                            <InfoItem label="Cuisine Type" value={profileData.preferences.cuisineType ?? 'Not set'} Icon={Earth} />
                            <InfoItem label="Target Calories" value={targetCaloriesLabel} Icon={Flame} />
                            <InfoItem label="Activity Level" value={profileData.preferences.activityLevel ?? 'Not set'} Icon={Footprints} isLast/>
                        </YStack>
                    </YStack>

                    <YStack gap="$space.xs">
                        <XStack ai="center" jc="space-between">
                            <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                                Metrics
                            </SizableText>
                            <Link href="/profile/edit-metric" asChild>
                                <XStack p="$xs" pressStyle={{ opacity: 0.7 }}>
                                    <Pencil size={20} col="$textPrimary" />
                                </XStack>
                            </Link>
                        </XStack>
                        <YStack br="$radius.md" bg="$surface" overflow="hidden">
                            <InfoItem label="Weight" value={metricWeightLabel} Icon={Ruler} />
                            <InfoItem label="Height" value={metricHeightLabel} Icon={Dumbbell} />
                            <InfoItem label="BMI" value={metricBmiLabel} Icon={Percent} isLast/>
                        </YStack>
                    </YStack>

                    <YStack gap="$space.xs">
                        <XStack ai="center" jc="space-between">
                            <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                                Favorite Ingredients
                            </SizableText>
                            <Link href="/profile/edit-favorite-ingredient" asChild>
                                <XStack p="$xs" pressStyle={{ opacity: 0.7 }}>
                                    <Pencil size={20} col="$textPrimary" />
                                </XStack>
                            </Link>
                        </XStack>
                        <XStack flexWrap="wrap" gap="$space.sm">
                            {profileData.favoriteIngredients.length > 0 ? (
                                profileData.favoriteIngredients.map((ingredient) => (
                                    <Tag key={ingredient.id} status="brand">
                                        <Tag.Text>{ingredient.name}</Tag.Text>
                                    </Tag>
                                ))
                            ) : (
                                <SizableText ff="$body" fos="$md" col="$textSubtle">
                                    No favorite ingredients yet.
                                </SizableText>
                            )}
                        </XStack>
                    </YStack>

                    <YStack gap="$space.xs">
                        <XStack ai="center" jc="space-between">
                            <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                                Allergies
                            </SizableText>
                            <Link href="/profile/edit-allergy" asChild>
                                <XStack p="$xs" pressStyle={{ opacity: 0.7 }}>
                                    <Pencil size={20} col="$textPrimary" />
                                </XStack>
                            </Link>
                        </XStack>
                        <XStack flexWrap="wrap" gap="$space.sm">
                            {profileData.allergies.length > 0 ? (
                                profileData.allergies.map((allergy) => (
                                    <Tag key={allergy.id} status="danger">
                                        <Tag.Text>{allergy.name}</Tag.Text>
                                    </Tag>
                                ))
                            ) : (
                                <SizableText ff="$body" fos="$md" col="$textSubtle">
                                    No allergies selected.
                                </SizableText>
                            )}
                        </XStack>
                    </YStack>

                    
                </YStack>



                
            </YStack>
            
        </ScrollView>
    );
}