import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView, YStack, XStack, SizableText } from 'tamagui';
import { Button, DatePicker, type DatePickerWeekValue } from '@components';
import { MacroStatDetailCard } from '@features/menu/components/MacroStatDetailCard';
import { MenuItemDetailModal } from '@features/menu/components/MenuItemDetailModal';
import { MenuMealTimeCard } from '@features/menu/components/MenuMealTimeCard';
import { MacroStatProgressCard } from '@features/menu/components/MacroStatProgressCard';
import { fetchProfileOverview } from '@features/profile/api/profile.api';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
    getSingleSearchParam,
    parseMenuFlowDateParam,
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
    sumLoggedMenuNutrition,
    type MenuMealItem,
    type MenuMealTimeGroup,
    type MenuNutrition,
} from '@features/menu/utils/menu-meal-times';
import {
    applyMenuItemPortionSizeToNutritionTotal,
    removeMenuItemNutritionFromTotal,
    removeMenuMealItemFromGroups,
    replaceMenuMealItemInGroups,
} from '@features/menu/utils/menu-state';
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
    const params = useLocalSearchParams<{ date?: string | string[] }>();
    const { session } = useSession();
    const today = useMemo(() => createTodayCalendarDate(), []);
    const routeDateParam = getSingleSearchParam(params.date);
    const [isWeekPickerOpen, setIsWeekPickerOpen] = useState(false);
    const [selectedWeek, setSelectedWeek] = useState<DatePickerWeekValue>(() => createWeekValue(today));
    const [selectedDate, setSelectedDate] = useState<Date>(() => today);
    const [selectedItem, setSelectedItem] = useState<MenuMealItem | null>(null);
    const [mealTimeGroups, setMealTimeGroups] = useState<MenuMealTimeGroup[]>(createEmptyMenuMealTimeGroups);
    const [nutritionTotal, setNutritionTotal] = useState<MenuNutrition>(EMPTY_MENU_NUTRITION);
    const [targetCalories, setTargetCalories] = useState<number | null>(null);
    const [screenError, setScreenError] = useState<string | null>(null);
    const [isLoadingMenu, setIsLoadingMenu] = useState(true);
    const routeSelectedDate = useMemo(
        () => parseMenuFlowDateParam(routeDateParam),
        [routeDateParam],
    );

    const weekDays = useMemo(() => getWeekDays(selectedWeek.startDate), [selectedWeek]);
    const headerDateLabel = useMemo(() => formatHeaderDate(selectedDate), [selectedDate]);
    const allowAddMeal = useMemo(() => !isPastCalendarDate(selectedDate, today), [selectedDate, today]);
    const showProgressCard = useMemo(() => compareCalendarDates(selectedDate, today) <= 0, [selectedDate, today]);
    const selectedApiDate = useMemo(() => formatMenuApiDate(selectedDate), [selectedDate]);
    const loggedNutritionTotal = useMemo(
        () => sumLoggedMenuNutrition(mealTimeGroups),
        [mealTimeGroups],
    );

    useEffect(() => {
        if (!routeSelectedDate) {
            return;
        }

        setSelectedWeek(createWeekValue(routeSelectedDate));
        setSelectedDate(routeSelectedDate);
    }, [routeSelectedDate]);

    const loadMenuData = useCallback(async (config: { isActive: () => boolean }) => {
        if (!session?.accessToken) {
            if (!config.isActive()) {
                return;
            }

            setMealTimeGroups(createEmptyMenuMealTimeGroups());
            setNutritionTotal(EMPTY_MENU_NUTRITION);
            setScreenError('Missing access token. Please sign in again.');
            setIsLoadingMenu(false);
            return;
        }

        if (!config.isActive()) {
            return;
        }

        setIsLoadingMenu(true);
        setScreenError(null);

        try {
            const nextMenuData = await fetchMenuScreenData({
                accessToken: session.accessToken,
                date: selectedApiDate,
            });

            if (!config.isActive()) {
                return;
            }

            setMealTimeGroups(nextMenuData.mealTimeGroups);
            setNutritionTotal(nextMenuData.nutritionTotal);
        } catch (error) {
            if (!config.isActive()) {
                return;
            }

            setMealTimeGroups(createEmptyMenuMealTimeGroups());
            setNutritionTotal(EMPTY_MENU_NUTRITION);
            setScreenError(resolveMenuScreenErrorMessage(error, 'Unable to load your menu right now.'));
        } finally {
            if (config.isActive()) {
                setIsLoadingMenu(false);
            }
        }
    }, [selectedApiDate, session?.accessToken]);

    const loadNutritionTargets = useCallback(async (config: { isActive: () => boolean }) => {
        if (!session?.accessToken) {
            if (!config.isActive()) {
                return;
            }

            setTargetCalories(null);
            return;
        }

        try {
            const profileOverview = await fetchProfileOverview({
                accessToken: session.accessToken,
            });

            if (!config.isActive()) {
                return;
            }

            setTargetCalories(profileOverview.preferences?.targetCalories ?? null);
        } catch {
            if (config.isActive()) {
                setTargetCalories(null);
            }
        }
    }, [session?.accessToken]);

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            void loadMenuData({
                isActive: () => isActive,
            });

            return () => {
                isActive = false;
            };
        }, [loadMenuData]),
    );

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            void loadNutritionTargets({
                isActive: () => isActive,
            });

            return () => {
                isActive = false;
            };
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
            throw new Error('Missing access token. Please sign in again.');
        }

        try {
            await deleteMenuItem({
                accessToken: session.accessToken,
                menuItemId: item.menuItemId,
            });

            setMealTimeGroups((currentGroups) =>
                removeMenuMealItemFromGroups(currentGroups, item.menuItemId),
            );
            setNutritionTotal((currentTotal) =>
                removeMenuItemNutritionFromTotal(currentTotal, item),
            );
        } catch (error) {
            throw new Error(
                resolveMenuScreenErrorMessage(error, 'Unable to remove this meal from your menu.'),
            );
        }
    }, [session?.accessToken]);

    const handleToggleLogged = useCallback(async (item: MenuMealItem) => {
        if (!session?.accessToken) {
            throw new Error('Missing access token. Please sign in again.');
        }

        try {
            await updateMenuItem({
                accessToken: session.accessToken,
                menuItemId: item.menuItemId,
                payload: {
                    eated: !item.eated,
                },
            });

            setMealTimeGroups((currentGroups) =>
                replaceMenuMealItemInGroups(currentGroups, {
                    ...item,
                    eated: !item.eated,
                }),
            );
        } catch (error) {
            throw new Error(
                resolveMenuScreenErrorMessage(error, 'Unable to update this meal status right now.'),
            );
        }
    }, [session?.accessToken]);

    const handleSaveItem = useCallback(async (item: MenuMealItem, portionSize: number) => {
        if (!session?.accessToken) {
            throw new Error('Missing access token. Please sign in again.');
        }

        try {
            await updateMenuItem({
                accessToken: session.accessToken,
                menuItemId: item.menuItemId,
                payload: {
                    portionSize,
                },
            });

            setMealTimeGroups((currentGroups) =>
                replaceMenuMealItemInGroups(currentGroups, {
                    ...item,
                    portionSize,
                }),
            );
            setNutritionTotal((currentTotal) =>
                applyMenuItemPortionSizeToNutritionTotal(currentTotal, item, portionSize),
            );
        } catch (error) {
            throw new Error(
                resolveMenuScreenErrorMessage(error, 'Unable to update this meal portion right now.'),
            );
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
                            calories={loggedNutritionTotal.calories}
                            calorieGoal={targetCalories}
                            protein={loggedNutritionTotal.protein}
                            fiber={loggedNutritionTotal.fiber}
                            fat={loggedNutritionTotal.fat}
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
                    onDelete={handleDeleteItem}
                    onLog={handleToggleLogged}
                    onSave={handleSaveItem}
                />

            </YStack>

        </ScrollView>
    );
}
