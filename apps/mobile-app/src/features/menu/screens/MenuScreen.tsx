import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, YStack, XStack, SizableText } from 'tamagui';
import { Button, DatePicker, type DatePickerWeekValue } from '@components';
import { MacroStatDetailCard } from '@features/menu/components/MacroStatDetailCard';
import { MenuItemDetailModal } from '@features/menu/components/MenuItemDetailModal';
import { MenuMealTimeCard } from '@features/menu/components/MenuMealTimeCard';
import { MacroStatProgressCard } from '@features/menu/components/MacroStatProgressCard';
import { fetchProfileOverview } from '@features/profile/api/profile.api';
import { useRouter } from 'expo-router';
import { WeekDateStrip } from '@features/menu/components/WeekDateStrip';
import { useSession } from '@/providers/AuthProvider';
import {
    createTodayCalendarDate,
    createWeekValue,
    formatHeaderDate,
    getWeekDays,
    normalizeWeekValue,
    resolveNextSelectedDate,
} from '@features/menu/utils/week-date';
import {
    formatMenuApiDate,
    formatMenuFlowDateParam,
    toMenuFlowMealTimeParam,
} from '@features/menu/utils/menu-flow';
import {
    deleteMenuItem,
    fetchMenuScreenData,
    updateMenuItem,
} from '@features/menu/api/menu.api';
import {
    compareCalendarDates,
    createEmptyMenuMealTimeGroups,
    isPastCalendarDate,
    type MenuMealItem,
    type MenuMealTimeGroup,
    type MenuNutrition,
} from '@features/menu/utils/menu-meal-times';
import { Calendar, Grid2x2Plus } from '@tamagui/lucide-icons-2';

const EMPTY_MENU_NUTRITION: MenuNutrition = {
    calories: 0,
    protein: 0,
    fiber: 0,
    fat: 0,
};

function resolveMenuScreenErrorMessage(error: unknown, fallbackMessage: string) {
    if (error instanceof Error && error.message.trim()) {
        return error.message.trim();
    }

    return fallbackMessage;
}

export default function MenuScreen() {
    const router = useRouter();
    const { session } = useSession();
    const today = useMemo(() => createTodayCalendarDate(), []);
    const [isWeekPickerOpen, setIsWeekPickerOpen] = useState(false);
    const [selectedWeek, setSelectedWeek] = useState<DatePickerWeekValue>(() => createWeekValue(today));
    const [selectedDate, setSelectedDate] = useState<Date>(() => today);
    const [selectedItem, setSelectedItem] = useState<MenuMealItem | null>(null);
    const [mealTimeGroups, setMealTimeGroups] = useState<MenuMealTimeGroup[]>(createEmptyMenuMealTimeGroups);
    const [nutritionTotal, setNutritionTotal] = useState<MenuNutrition>(EMPTY_MENU_NUTRITION);
    const [targetCalories, setTargetCalories] = useState<number | null>(null);
    const [screenError, setScreenError] = useState<string | null>(null);
    const [isLoadingMenu, setIsLoadingMenu] = useState(true);
    const [reloadNonce, setReloadNonce] = useState(0);

    const weekDays = useMemo(() => getWeekDays(selectedWeek.startDate), [selectedWeek]);
    const headerDateLabel = useMemo(() => formatHeaderDate(selectedDate), [selectedDate]);
    const allowAddMeal = useMemo(() => !isPastCalendarDate(selectedDate, today), [selectedDate, today]);
    const showProgressCard = useMemo(() => compareCalendarDates(selectedDate, today) <= 0, [selectedDate, today]);
    const selectedApiDate = useMemo(() => formatMenuApiDate(selectedDate), [selectedDate]);

    const loadMenuData = useCallback(async () => {
        if (!session?.accessToken) {
            setMealTimeGroups(createEmptyMenuMealTimeGroups());
            setNutritionTotal(EMPTY_MENU_NUTRITION);
            setScreenError('Missing access token. Please sign in again.');
            setIsLoadingMenu(false);
            return;
        }

        setIsLoadingMenu(true);
        setScreenError(null);

        try {
            const nextMenuData = await fetchMenuScreenData({
                accessToken: session.accessToken,
                date: selectedApiDate,
            });

            setMealTimeGroups(nextMenuData.mealTimeGroups);
            setNutritionTotal(nextMenuData.nutritionTotal);
        } catch (error) {
            setMealTimeGroups(createEmptyMenuMealTimeGroups());
            setNutritionTotal(EMPTY_MENU_NUTRITION);
            setScreenError(resolveMenuScreenErrorMessage(error, 'Unable to load your menu right now.'));
        } finally {
            setIsLoadingMenu(false);
        }
    }, [selectedApiDate, session?.accessToken]);

    const loadNutritionTargets = useCallback(async () => {
        if (!session?.accessToken) {
            setTargetCalories(null);
            return;
        }

        try {
            const profileOverview = await fetchProfileOverview({
                accessToken: session.accessToken,
            });

            setTargetCalories(profileOverview.preferences?.targetCalories ?? null);
        } catch {
            setTargetCalories(null);
        }
    }, [session?.accessToken]);

    useFocusEffect(
        useCallback(() => {
            void loadMenuData();
        }, [loadMenuData, reloadNonce]),
    );

    useFocusEffect(
        useCallback(() => {
            void loadNutritionTargets();
        }, [loadNutritionTargets]),
    );

    const handleWeekChange = (value: DatePickerWeekValue) => {
        const normalizedWeek = normalizeWeekValue(value);
        const nextSelectedDate = resolveNextSelectedDate(normalizedWeek, selectedDate, today);

        setSelectedWeek(normalizedWeek);
        setSelectedDate(nextSelectedDate);
    };

    const handleSelectedDateChange = (value: Date) => {
        setSelectedDate(value);
    };

    const handleAddMeal = (mealTime: 'BREAKFAST' | 'LUNCH' | 'DINNER') => {
        router.push({
            pathname: '/meal-search',
            params: {
                mealTime: toMenuFlowMealTimeParam(mealTime),
                date: formatMenuFlowDateParam(selectedDate),
            },
        });
    };

    const handleItemDetailOpenChange = (open: boolean) => {
        if (!open) {
            setSelectedItem(null);
        }
    };

    const handleDeleteItem = useCallback(async (item: MenuMealItem) => {
        if (!session?.accessToken) {
            setScreenError('Missing access token. Please sign in again.');
            return;
        }

        setScreenError(null);
        setSelectedItem(null);

        try {
            await deleteMenuItem({
                accessToken: session.accessToken,
                menuItemId: item.menuItemId,
            });
            setReloadNonce((currentValue) => currentValue + 1);
        } catch (error) {
            setScreenError(resolveMenuScreenErrorMessage(error, 'Unable to remove this meal from your menu.'));
        }
    }, [session?.accessToken]);

    const handleToggleLogged = useCallback(async (item: MenuMealItem) => {
        if (!session?.accessToken) {
            setScreenError('Missing access token. Please sign in again.');
            return;
        }

        setScreenError(null);
        setSelectedItem(null);

        try {
            await updateMenuItem({
                accessToken: session.accessToken,
                menuItemId: item.menuItemId,
                payload: {
                    eated: !item.eated,
                },
            });
            setReloadNonce((currentValue) => currentValue + 1);
        } catch (error) {
            setScreenError(resolveMenuScreenErrorMessage(error, 'Unable to update this meal status right now.'));
        }
    }, [session?.accessToken]);

    const handleSaveItem = useCallback(async (item: MenuMealItem, portionSize: number) => {
        if (!session?.accessToken) {
            setScreenError('Missing access token. Please sign in again.');
            return;
        }

        setScreenError(null);

        try {
            await updateMenuItem({
                accessToken: session.accessToken,
                menuItemId: item.menuItemId,
                payload: {
                    portionSize,
                },
            });
            setReloadNonce((currentValue) => currentValue + 1);
        } catch (error) {
            setScreenError(resolveMenuScreenErrorMessage(error, 'Unable to update this meal portion right now.'));
        }
    }, [session?.accessToken]);

    return (
        <ScrollView bg="$background" f={1}>
            <YStack w="100%" ai="center" jc="flex-start" p="$space.md" pb="$space.xl" gap="$space.lg">
                <XStack w="100%" ai="center" jc="space-between">
                    <SizableText color="$text" ff="$heading" fos="$lg" fow="$bold">
                        {headerDateLabel}
                    </SizableText>
                    <XStack ai="center" gap="$space.sm">  
                        <Button size="medium" w={36} color="secondary" onPress={() => setIsWeekPickerOpen(true)}>
                            <Button.Icon icon={Calendar}/>
                        </Button>
                        <Button size="medium" color="primary" onPress={() => router.push('/template')}>
                            <Button.Icon icon={Grid2x2Plus}/>
                            <Button.Text>Templates</Button.Text>
                        </Button>
                    </XStack>
                </XStack>

                <YStack w="100%">
                    <WeekDateStrip
                        days={weekDays}
                        selectedDate={selectedDate}
                        today={today}
                        onDayPress={handleSelectedDateChange}
                    />
                </YStack>

                {!isLoadingMenu && !screenError ? (
                    showProgressCard ? (
                        <MacroStatProgressCard
                            calories={nutritionTotal.calories}
                            calorieGoal={targetCalories}
                            protein={nutritionTotal.protein}
                            fiber={nutritionTotal.fiber}
                            fat={nutritionTotal.fat}
                        />
                    ) : (
                        <MacroStatDetailCard
                            calories={nutritionTotal.calories}
                            protein={nutritionTotal.protein}
                            fiber={nutritionTotal.fiber}
                            fat={nutritionTotal.fat}
                        />
                    )
                ) : null}

                {isLoadingMenu ? (
                    <XStack w="100%" ai="center" gap="$space.sm">
                        <ActivityIndicator />
                        <SizableText ff="$body" fos="$sm" col="$textSubtle">
                            Loading menu...
                        </SizableText>
                    </XStack>
                ) : null}

                {screenError ? (
                    <SizableText w="100%" ff="$body" fos="$sm" col="$danger">
                        {screenError}
                    </SizableText>
                ) : null}

                <YStack w="100%" gap="$space.lg">
                    {mealTimeGroups.map((mealTimeGroup) => (
                        <MenuMealTimeCard
                            key={mealTimeGroup.mealTime}
                            mealTimeGroup={mealTimeGroup}
                            allowAddMeal={allowAddMeal}
                            onAddMeal={handleAddMeal}
                            onItemPress={setSelectedItem}
                        />
                    ))}
                </YStack>

                <DatePicker
                    mode="week"
                    open={isWeekPickerOpen}
                    onOpenChange={setIsWeekPickerOpen}
                    value={selectedWeek}
                    onValueChange={handleWeekChange}
                />

                <MenuItemDetailModal
                    item={selectedItem}
                    open={selectedItem !== null}
                    onOpenChange={handleItemDetailOpenChange}
                    onDelete={(item) => void handleDeleteItem(item)}
                    onLog={(item) => void handleToggleLogged(item)}
                    onSave={(item, portionSize) => void handleSaveItem(item, portionSize)}
                />

            </YStack>

        </ScrollView>
    );
}
