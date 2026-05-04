import { SizableText, YStack, XStack, ScrollView, AnimatePresence } from 'tamagui';
import { MealCard } from '../components/MealCard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, SlidersHorizontal } from '@tamagui/lucide-icons-2';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InputSearch, Button } from '@components';
import { useAppTheme } from '@/providers/AppProviders';
import { useTheme } from 'tamagui';
import { useState } from 'react';
import { mockMeals } from '../mockMeals';
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

export default function MealSearchScreen() {
    const theme = useTheme();
    const { themeName } = useAppTheme();
    const router = useRouter();
    const params = useLocalSearchParams<{ mealTime?: string | string[]; date?: string | string[] }>();
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [appliedFilters, setAppliedFilters] = useState<MealFilters>(createEmptyMealFilters);
    const [draftFilters, setDraftFilters] = useState<MealFilters>(createEmptyMealFilters);
    const mealTimeParam = getSingleSearchParam(params.mealTime);
    const dateParam = getSingleSearchParam(params.date);
    const headerTitle = buildAddToMenuLabel(mealTimeParam, dateParam) ?? 'Search';

    function handleOpenFilterSheet() {
        setDraftFilters(cloneMealFilters(appliedFilters));
        setIsFilterSheetOpen(true);
    }

    function handleCloseFilterSheet() {
        setIsFilterSheetOpen(false);
    }

    function handleToggleDifficulty(difficulty: MealDifficultyFilter) {
        setDraftFilters((currentFilters) => {
            const hasDifficulty = currentFilters.difficulty.includes(difficulty);

            return {
                ...currentFilters,
                difficulty: hasDifficulty
                    ? currentFilters.difficulty.filter((item) => item !== difficulty)
                    : [...currentFilters.difficulty, difficulty],
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
                        <InputSearch placeholder="Search for meals..."/>
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
                    <YStack w="100%" gap="$space.md" pb="$space.xl">
                        {mockMeals.map((meal) => (
                            <MealCard
                                key={meal.id}
                                id={meal.id}
                                href={mealTimeParam && dateParam ? {
                                    pathname: '/meal-search/[mealId]',
                                    params: {
                                        mealId: meal.id,
                                        mealTime: mealTimeParam,
                                        date: dateParam,
                                    },
                                } : undefined}
                                mealName={meal.mealName}
                                cookTime={meal.cookTime}
                                difficulty={meal.difficulty}
                                totalCalories={meal.totalCalories}
                                totalProtein={meal.totalProtein}
                                totalCarbs={meal.totalCarbs}
                                totalFat={meal.totalFat}
                            />
                        ))}
                    </YStack>
                </ScrollView>

                <MealFilterSheet
                    open={isFilterSheetOpen}
                    filters={draftFilters}
                    onClose={handleCloseFilterSheet}
                    onClear={handleClearFilters}
                    onApply={handleApplyFilters}
                    onToggleDifficulty={handleToggleDifficulty}
                    onSelectCookingTime={handleSelectCookingTime}
                />

            </YStack>
            
        </SafeAreaView>
    );
}