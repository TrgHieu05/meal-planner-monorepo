import { useMemo, useState } from 'react';
import { ScrollView, YStack, XStack, SizableText } from 'tamagui';
import { Button, DatePicker, type DatePickerWeekValue } from '@components';
import { MenuItemDetailModal } from '@features/menu/components/MenuItemDetailModal';
import { MenuMealTimeCard } from '@features/menu/components/MenuMealTimeCard';
import { useRouter } from 'expo-router';
import { WeekDateStrip } from '@features/menu/components/WeekDateStrip';
import {
    createTodayCalendarDate,
    createWeekValue,
    formatHeaderDate,
    getWeekDays,
    normalizeWeekValue,
    resolveNextSelectedDate,
} from '@features/menu/utils/week-date';
import { formatMenuFlowDateParam, toMenuFlowMealTimeParam } from '@features/menu/utils/menu-flow';
import {
    createMockMenuMealTimes,
    isPastCalendarDate,
    type MenuMealItem,
} from '@features/menu/utils/menu-meal-times';
import { Calendar, Grid2x2Plus } from '@tamagui/lucide-icons-2';

export default function MenuScreen() {
    const router = useRouter();
    const today = useMemo(() => createTodayCalendarDate(), []);
    const [isWeekPickerOpen, setIsWeekPickerOpen] = useState(false);
    const [selectedWeek, setSelectedWeek] = useState<DatePickerWeekValue>(() => createWeekValue(today));
    const [selectedDate, setSelectedDate] = useState<Date>(() => today);
    const [selectedItem, setSelectedItem] = useState<MenuMealItem | null>(null);

    const weekDays = useMemo(() => getWeekDays(selectedWeek.startDate), [selectedWeek]);
    const headerDateLabel = useMemo(() => formatHeaderDate(selectedDate), [selectedDate]);
    const mealTimeGroups = useMemo(() => createMockMenuMealTimes(selectedDate, today), [selectedDate, today]);
    const allowAddMeal = useMemo(() => !isPastCalendarDate(selectedDate, today), [selectedDate, today]);

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
                />

            </YStack>

        </ScrollView>
    );
}
