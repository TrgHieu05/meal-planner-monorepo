import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { SizableText, YStack, XStack, AnimatePresence } from 'tamagui';
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
    isDefaultMealCookingTimeFilter,
    MealFilterSheet,
    sanitizeMealCookingTimeFilter,
    type MealCookingTimeFilter,
    type MealDifficultyFilter,
    type MealFilters,
} from '../components/MealFilterSheet';

import { fetchMealSearchScreenData } from '../api/meal.api';
import { fetchAllergies } from '@features/profile/api/profile.api';
import { useSession } from '@/providers/AuthProvider';
import {
    mergeMealSearchScreenData,
} from './meal-search-pagination';

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

function buildMealSearchBaseQuery(params: {
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
        ...cookingTimeQuery,
    };
}

function buildMealSearchQuery(
    baseQuery: Partial<MealSearchQuery>,
    page: number,
): Partial<MealSearchQuery> {
    return {
        ...baseQuery,
        page,
        pageSize: MEAL_SEARCH_PAGE_SIZE,
    };
}

function getCookingTimeQuery(cookingTime: MealCookingTimeFilter | null) {
    const normalizedCookingTime = sanitizeMealCookingTimeFilter(cookingTime);

    if (isDefaultMealCookingTimeFilter(normalizedCookingTime)) {
        return {};
    }

    return {
        cookTimeMin: normalizedCookingTime.min,
        cookTimeMax: normalizedCookingTime.max,
    };
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
    const [isLoadingMoreMeals, setIsLoadingMoreMeals] = useState(false);
    const [profileAllergyNames, setProfileAllergyNames] = useState<string[]>([]);
    const [isAllergyContextReady, setIsAllergyContextReady] = useState(false);
    const [reloadNonce, setReloadNonce] = useState(0);
    const mealTimeParam = getSingleSearchParam(params.mealTime);
    const dateParam = getSingleSearchParam(params.date);
    const headerTitle = buildAddToMenuLabel(mealTimeParam, dateParam) ?? 'Search';

    const mealSearchBaseQuery = useMemo(() => {
        return buildMealSearchBaseQuery({
            searchValue,
            filters: appliedFilters,
            allergyNames: profileAllergyNames,
        });
    }, [appliedFilters, profileAllergyNames, searchValue]);
    const mealSearchQueryKey = useMemo(
        () => JSON.stringify(mealSearchBaseQuery),
        [mealSearchBaseQuery],
    );
    const latestMealSearchQueryKeyRef = useRef(mealSearchQueryKey);
    const canLoadMoreOnEndReachedRef = useRef(false);

    useEffect(() => {
        latestMealSearchQueryKeyRef.current = mealSearchQueryKey;
    }, [mealSearchQueryKey]);

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
        canLoadMoreOnEndReachedRef.current = false;
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
                setIsLoadingMoreMeals(false);
                setErrorMessage(null);

                try {
                    const nextMealSearchData = await fetchMealSearchScreenData({
                        accessToken: session.accessToken,
                        query: buildMealSearchQuery(mealSearchBaseQuery, 1),
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
    }, [isAllergyContextReady, mealSearchBaseQuery, reloadNonce, session?.accessToken]);

    const loadMoreMeals = useCallback(async () => {
        if (
            !session?.accessToken ||
            !isAllergyContextReady ||
            isLoadingMeals ||
            isLoadingMoreMeals ||
            !mealSearchData?.hasMore
        ) {
            return;
        }

        const nextPage = mealSearchData.page + 1;
        const requestQueryKey = latestMealSearchQueryKeyRef.current;

        setIsLoadingMoreMeals(true);

        try {
            const nextMealSearchData = await fetchMealSearchScreenData({
                accessToken: session.accessToken,
                query: buildMealSearchQuery(mealSearchBaseQuery, nextPage),
            });

            if (requestQueryKey !== latestMealSearchQueryKeyRef.current) {
                return;
            }

            setMealSearchData((currentData) => {
                if (!currentData) {
                    return nextMealSearchData;
                }

                return mergeMealSearchScreenData(currentData, nextMealSearchData);
            });
        } finally {
            if (requestQueryKey === latestMealSearchQueryKeyRef.current) {
                setIsLoadingMoreMeals(false);
            }
        }
    }, [
        isAllergyContextReady,
        isLoadingMeals,
        isLoadingMoreMeals,
        mealSearchBaseQuery,
        mealSearchData,
        session?.accessToken,
    ]);

    const handleMealListScrollBegin = useCallback(() => {
        canLoadMoreOnEndReachedRef.current = true;
    }, []);

    const handleMealListEndReached = useCallback(() => {
        if (!canLoadMoreOnEndReachedRef.current) {
            return;
        }

        canLoadMoreOnEndReachedRef.current = false;
        void loadMoreMeals();
    }, [loadMoreMeals]);

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

    function handleClearFilters() {
        const clearedFilters = createEmptyMealFilters();
        setDraftFilters(clearedFilters);
        setAppliedFilters(clearedFilters);
    }

    function handleApplyFilters(cookingTime: MealCookingTimeFilter) {
        const nextDraftFilters = cloneMealFilters({
            ...draftFilters,
            cookingTime,
        });

        setDraftFilters(nextDraftFilters);
        setAppliedFilters(nextDraftFilters);
        setIsFilterSheetOpen(false);
    }

    const isFiltered = hasAppliedMealFilters(appliedFilters);
    const mealCards = mealSearchData?.list ?? [];
    const hasMoreMeals = mealSearchData?.hasMore ?? false;
    const isInitialLoading = isLoadingMeals && mealSearchData === null && !errorMessage;
    const mealCardHrefs = useMemo(() => {
        return new Map(
            mealCards.map((meal) => [
                meal.mealId,
                {
                    pathname: '/meal-search/[mealId]' as const,
                    params: {
                        mealId: `${meal.mealId}`,
                        ...(mealTimeParam ? { mealTime: mealTimeParam } : {}),
                        ...(dateParam ? { date: dateParam } : {}),
                    },
                },
            ]),
        );
    }, [dateParam, mealCards, mealTimeParam]);

    const mealListHeader = isLoadingMeals ? (
        <XStack ai="center" gap="$space.sm" pb="$space.md">
            <ActivityIndicator color={theme.primary.val} />
            <SizableText ff="$body" fos="$sm" col="$textSubtle">
                Updating results...
            </SizableText>
        </XStack>
    ) : null;

    const mealListFooter = isLoadingMoreMeals ? (
        <XStack ai="center" jc="center" gap="$space.sm" py="$md">
            <ActivityIndicator color={theme.primary.val} />
            <SizableText ff="$body" fos="$sm" col="$textSubtle">
                Loading more meals...
            </SizableText>
        </XStack>
    ) : !isLoadingMeals && !isLoadingMoreMeals && !hasMoreMeals && mealCards.length > 0 ? (
        <SizableText ff="$body" fos="$sm" col="$textSubtle" ta="center" py="$sm">
            No more meal to show
        </SizableText>
    ) : null;

    const renderMealCard = useCallback(
        ({ item }: { item: MealSearchScreenData['list'][number] }) => (
            <YStack pb="$space.md">
                <MealCard
                    id={item.mealId}
                    href={mealCardHrefs.get(item.mealId)}
                    mealName={item.mealName}
                    cookTime={item.cookTime}
                    difficulty={item.difficulty}
                    totalCalories={item.totalCalories}
                    totalProtein={item.totalProtein}
                    totalFiber={item.totalFiber}
                    totalFat={item.totalFat}
                />
            </YStack>
        ),
        [mealCardHrefs],
    );

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
            <FlatList
                data={mealCards}
                keyExtractor={(meal) => `${meal.mealId}`}
                renderItem={renderMealCard}
                style={{ flex: 1, width: '100%' }}
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                onScrollBeginDrag={handleMealListScrollBegin}
                onMomentumScrollBegin={handleMealListScrollBegin}
                onEndReachedThreshold={0.2}
                onEndReached={handleMealListEndReached}
                ListHeaderComponent={mealListHeader}
                ListFooterComponent={mealListFooter}
            />
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

                <YStack f={1} w="100%">
                    {content}
                </YStack>

                <MealFilterSheet
                    open={isFilterSheetOpen}
                    filters={draftFilters}
                    onClose={handleCloseFilterSheet}
                    onClear={handleClearFilters}
                    onApply={handleApplyFilters}
                    onSelectDifficulty={handleSelectDifficulty}
                />

            </YStack>
            
        </SafeAreaView>
    );
}