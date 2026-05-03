import { useMemo, useState } from 'react';
import { ScrollView, YStack, XStack, SizableText } from 'tamagui';
import { Button, DatePicker, type DatePickerWeekValue } from '@components';
import { MacroStatDetailCard } from '@features/menu/components/MacroStatDetailCard';
import { MacroStatProgressCard } from '@features/menu/components/MacroStatProgressCard';
import { WeekDateStrip } from '@features/menu/components/WeekDateStrip';
import {
    createTodayCalendarDate,
    createWeekValue,
    formatHeaderDate,
    getWeekDays,
    normalizeWeekValue,
    resolveNextSelectedDate,
} from '@features/menu/utils/week-date';
import { Calendar, Grid2x2Plus } from '@tamagui/lucide-icons-2';

export default function MenuScreen() {
    const today = useMemo(() => createTodayCalendarDate(), []);
    const [isWeekPickerOpen, setIsWeekPickerOpen] = useState(false);
    const [selectedWeek, setSelectedWeek] = useState<DatePickerWeekValue>(() => createWeekValue(today));
    const [selectedDate, setSelectedDate] = useState<Date>(() => today);

    const weekDays = useMemo(() => getWeekDays(selectedWeek.startDate), [selectedWeek]);
    const headerDateLabel = useMemo(() => formatHeaderDate(selectedDate), [selectedDate]);

    const handleWeekChange = (value: DatePickerWeekValue) => {
        const normalizedWeek = normalizeWeekValue(value);
        const nextSelectedDate = resolveNextSelectedDate(normalizedWeek, selectedDate, today);

        setSelectedWeek(normalizedWeek);
        setSelectedDate(nextSelectedDate);
    };

    const handleSelectedDateChange = (value: Date) => {
        setSelectedDate(value);
    };

    return (
        <ScrollView bg="$background" f={1}>
            <YStack w="100%" ai="center" jc="flex-start" p="$space.md" gap="$space.lg">
                <XStack w="100%" ai="center" jc="space-between">
                    <SizableText color="$text" ff="$heading" fos="$lg" fow="$bold">
                        {headerDateLabel}
                    </SizableText>
                    <XStack ai="center" gap="$space.sm">  
                        <Button size="medium" w={36} color="secondary" onPress={() => setIsWeekPickerOpen(true)}>
                            <Button.Icon icon={Calendar}/>
                        </Button>
                        <Button size="medium" color="primary">
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

                <DatePicker
                    mode="week"
                    open={isWeekPickerOpen}
                    onOpenChange={setIsWeekPickerOpen}
                    value={selectedWeek}
                    onValueChange={handleWeekChange}
                />

            </YStack>

        </ScrollView>
    );
}
