import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { SizableText, YStack, XStack, ScrollView, AnimatePresence } from 'tamagui';
import { MealCard } from '../components/MealCard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, SlidersHorizontal } from '@tamagui/lucide-icons-2';
import { InputSearch, Button } from '@components';
import { useAppTheme } from '@/providers/AppProviders';
import { useTheme } from 'tamagui';
import { buildAddToMenuLabel, getSingleSearchParam } from '@features/menu/utils/menu-flow';
import {
    cloneMealFilters,
    createEmptyMealFilters,
    hasAppliedMealFilters,
    MealFilterSheet,
    type MealCookingTimeFilter,
    type MealDifficultyFilter,
    type MealFilters,
} from '../components/MealFilterSheet';

import { fetchMealSearchScreenData } from '../api/meal.api';
import { fetchAllergies } from '@features/profile/api/profile.api';
import { useSession } from '@/providers/AuthProvider';

import type { MealSearchQuery } from '@meal/shared/types/meal-search';
import type { MealSearchScreenData } from '../types';

const SEARCH_DEBOUNCE_MS = 300;
const MEAL_SEARCH_PAGE_SIZE = 10;

function resolveMealSearchErrorMessage(error: unknown, fallbackMessage: string) {
    if (error instanceof Error && error.message.trim()) {
        return error.message.trim();
    }

    return fallbackMessage;
}

function buildMealSearchQuery(params: {
    searchValue: string;
    filters: MealFilters;
    allergyNames: string[];
}): Partial<MealSearchQuery> {
    const allergyQuery = params.allergyNames
        .map((name) => name.trim())
        .filter((name) => name.length > 0)
        .join(',');

    const cookingTimeQuery = getCookingTimeQuery(params.filters.cookingTime);

    return {
        q: params.searchValue,
        difficulty: params.filters.difficulty ?? undefined,
        allergies: allergyQuery.length > 0 ? allergyQuery : undefined,
        page: 1,
        pageSize: MEAL_SEARCH_PAGE_SIZE,
        ...cookingTimeQuery,
    };
}

function getCookingTimeQuery(cookingTime: MealCookingTimeFilter | null) {
    switch (cookingTime) {
        case '<30m':
            return { cookTimeMax: 30 };
        case '<45m':
            return { cookTimeMax: 45 };
        case '<1hour':
            return { cookTimeMax: 60 };
        default:
            return {};
    }
}

export default function MealSearchScreen() {
    const theme = useTheme();
    const { themeName } = useAppTheme();
    const { session } = useSession();
    const router = useRouter();
    const params = useLocalSearchParams<{ mealTime?: string | string[]; date?: string | string[] }>();
    const [searchValue, setSearchValue] = useState('');
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<MealFilters>(createEmptyMealFilters);
    const [draftFilters, setDraftFilters] = useState<MealFilters>(createEmptyMealFilters);
    const [mealSearchData, setMealSearchData] = useState<MealSearchScreenData | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoadingMeals, setIsLoadingMeals] = useState(true);
    const [profileAllergyNames, setProfileAllergyNames] = useState<string[]>([]);
    const [isAllergyContextReady, setIsAllergyContextReady] = useState(false);
    const [reloadNonce, setReloadNonce] = useState(0);
    const mealTimeParam = getSingleSearchParam(params.mealTime);
    const dateParam = getSingleSearchParam(params.date);
    const headerTitle = buildAddToMenuLabel(mealTimeParam, dateParam) ?? 'Search';

    const mealSearchQuery = useMemo(() => {
        return buildMealSearchQuery({
            searchValue,
            filters: appliedFilters,
            allergyNames: profileAllergyNames,
        });
    }, [appliedFilters, profileAllergyNames, searchValue]);

    const loadProfileAllergyContext = useCallback(async () => {
        if (!session?.accessToken) {
            setProfileAllergyNames([]);
            setIsAllergyContextReady(true);
            return;
        }

        setIsAllergyContextReady(false);

        try {
            const response = await fetchAllergies({
                accessToken: session.accessToken,
            });
            setProfileAllergyNames(response.list.map((ingredient) => ingredient.name));
        } catch {
            setProfileAllergyNames([]);
        } finally {
            setIsAllergyContextReady(true);
        }
    }, [session?.accessToken]);

    const handleRetry = useCallback(() => {
        setReloadNonce((currentValue) => currentValue + 1);
        void loadProfileAllergyContext();
    }, [loadProfileAllergyContext]);

    useFocusEffect(useCallback(() => {
        void loadProfileAllergyContext();
    }, [loadProfileAllergyContext]));

    useEffect(() => {
        if (!session?.accessToken) {
            setMealSearchData(null);
            setErrorMessage('Missing access token. Please sign in again.');
            setIsLoadingMeals(false);
            return;
        }

        if (!isAllergyContextReady) {
            setIsLoadingMeals(true);
            return;
        }

        let isActive = true;
        const timeoutId = setTimeout(() => {
            void (async () => {
                setIsLoadingMeals(true);
                setErrorMessage(null);

                try {
                    const nextMealSearchData = await fetchMealSearchScreenData({
                        accessToken: session.accessToken,
                        query: mealSearchQuery,
                    });

                    if (!isActive) {
                        return;
                    }

                    setMealSearchData(nextMealSearchData);
                } catch (error) {
                    if (!isActive) {
                        return;
                    }

                    setMealSearchData(null);
                    setErrorMessage(
                        resolveMealSearchErrorMessage(error, 'Unable to load meals right now.'),
                    );
                } finally {
                    if (isActive) {
                        setIsLoadingMeals(false);
                    }
                }
            })();
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            isActive = false;
            clearTimeout(timeoutId);
        };
    }, [isAllergyContextReady, mealSearchQuery, reloadNonce, session?.accessToken]);

    function handleOpenFilterSheet() {
        setDraftFilters(cloneMealFilters(appliedFilters));
        setIsFilterSheetOpen(true);
    }

    function handleCloseFilterSheet() {
        setIsFilterSheetOpen(false);
    }

    function handleSelectDifficulty(difficulty: MealDifficultyFilter) {
        setDraftFilters((currentFilters) => {
            return {
                ...currentFilters,
                difficulty: currentFilters.difficulty === difficulty ? null : difficulty,
            };
        });
    }

    function handleSelectCookingTime(cookingTime: MealCookingTimeFilter) {
        setDraftFilters((currentFilters) => ({
            ...currentFilters,
            cookingTime,
        }));
    }

    function handleClearFilters() {
        const clearedFilters = createEmptyMealFilters();
        setDraftFilters(clearedFilters);
        setAppliedFilters(clearedFilters);
    }

    function handleApplyFilters() {
        setAppliedFilters(cloneMealFilters(draftFilters));
        setIsFilterSheetOpen(false);
    }

    const isFiltered = hasAppliedMealFilters(appliedFilters);
    const mealCards = mealSearchData?.list ?? [];
    const isInitialLoading = isLoadingMeals && mealSearchData === null && !errorMessage;

    const content = (() => {
        if (isInitialLoading) {
            return (
                <YStack f={1} ai="center" jc="center" gap="$sm" py="$space.xl">
                    <ActivityIndicator color={theme.primary.val} />
                    <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                        Loading meals
                    </SizableText>
                    <SizableText ff="$body" fos="$md" col="$textSubtle" ta="center">
                        Fetching the latest meal suggestions from the server.
                    </SizableText>
                </YStack>
            );
        }

        if (errorMessage) {
            return (
                <YStack f={1} ai="center" jc="center" gap="$md" py="$space.xl">
                    <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                        Unable to load meals
                    </SizableText>
                    <SizableText ff="$body" fos="$md" col="$danger" ta="center">
                        {errorMessage}
                    </SizableText>
                    <Button color="secondary" onPress={handleRetry}>
                        <Button.Text>Retry</Button.Text>
                    </Button>
                </YStack>
            );
        }

        if (mealCards.length === 0) {
            return (
                <YStack f={1} ai="center" jc="center" gap="$sm" py="$space.xl">
                    <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                        No meals found
                    </SizableText>
                    <SizableText ff="$body" fos="$md" col="$textSubtle" ta="center">
                        {searchValue.trim().length > 0 || isFiltered
                            ? 'Try another keyword or adjust your filters.'
                            : 'No meals are available for the current criteria.'}
                    </SizableText>
                </YStack>
            );
        }

        return (
            <YStack w="100%" gap="$space.md" pb="$space.xl">
                {isLoadingMeals ? (
                    <XStack ai="center" gap="$space.sm">
                        <ActivityIndicator color={theme.primary.val} />
                        <SizableText ff="$body" fos="$sm" col="$textSubtle">
                            Updating results...
                        </SizableText>
                    </XStack>
                ) : null}
                {mealCards.map((meal) => (
                    <MealCard
                        key={meal.mealId}
                        id={meal.mealId}
                        href={{
                            pathname: '/meal-search/[mealId]',
                            params: {
                                mealId: `${meal.mealId}`,
                                ...(mealTimeParam ? { mealTime: mealTimeParam } : {}),
                                ...(dateParam ? { date: dateParam } : {}),
                            },
                        }}
                        mealName={meal.mealName}
                        cookTime={meal.cookTime}
                        difficulty={meal.difficulty}
                        totalCalories={meal.totalCalories}
                        totalProtein={meal.totalProtein}
                        totalFiber={meal.totalFiber}
                        totalFat={meal.totalFat}
                    />
                ))}
            </YStack>
        );
    })();

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.background.val }}>
            <StatusBar barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'} />
            
            <AnimatePresence>     
                {isFilterSheetOpen && 
                    <YStack position='absolute' top={0} left={0} w="100%" h="100%" bg="$gray15" opacity={0.5} zIndex={1}
                        transition={{ enter: "quick", exit: "quick" }}
                        exitStyle={{ opacity: 0 }}
                        enterStyle={{ opacity: 0 }}
                    />
                }
            </AnimatePresence>

            <YStack ai="center" p="$space.md" pb={0} jc="center" w="100%" h="100%" gap="$space.lg">
                <XStack h={40} w="100%" ai="center" jc="center" pos="relative">
                    <XStack br="$radius.sm" pos="absolute" l={0} p="$xs" onPress={() => router.back()} pressStyle={{ bg:"$surfacePress", opacity: 0.7 }}>
                        <ChevronLeft color="$text" size={24} />
                    </XStack>
                    <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                        {headerTitle}
                    </SizableText>
                </XStack>

                <XStack w="100%" ai="center" gap="$space.sm">
                    <XStack f={1}>
                        <InputSearch
                            placeholder="Search for meals..."
                            value={searchValue}
                            onChangeText={setSearchValue}
                        />
                    </XStack>
                    <Button
                        w={52}
                        h={52}
                        color={isFiltered ? "primary" : "secondary"}
                        onPress={handleOpenFilterSheet}
                    >
                        <Button.Icon icon={SlidersHorizontal} size={20} />
                    </Button>
                </XStack>

                <ScrollView w="100%" showsVerticalScrollIndicator={false}>
                    {content}
                </ScrollView>

                <MealFilterSheet
                    open={isFilterSheetOpen}
                    filters={draftFilters}
                    onClose={handleCloseFilterSheet}
                    onClear={handleClearFilters}
                    onApply={handleApplyFilters}
                    onSelectDifficulty={handleSelectDifficulty}
                    onSelectCookingTime={handleSelectCookingTime}
                />

            </YStack>
            
        </SafeAreaView>
    );
}