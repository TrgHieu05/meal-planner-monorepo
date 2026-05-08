import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, Clipboard, Copy, Plus, Trash2 } from '@tamagui/lucide-icons-2';
import { Label, ScrollView, SizableText, XStack, YStack } from 'tamagui';

import { Button, InputText, InputTextArea } from '@components';
import { MacroStatDetailCard } from '@features/menu/components/MacroStatDetailCard';
import { MenuMealTimeCard } from '@features/menu/components/MenuMealTimeCard';
import { DayTab } from '@features/template/components/DayTab';
import {
    createEmptyMenuMealTimeGroups,
    sumMenuMealTimeNutrition,
    type MenuMealItem,
    type MenuMealTimeGroup,
    type MenuNutrition,
} from '@features/menu/utils/menu-meal-times';

type TemplateDayState = {
    id: string;
    mealTimeGroups: MenuMealTimeGroup[];
};

type TemplateMealItemsByTime = Partial<Record<MenuMealTimeGroup['mealTime'], MenuMealItem[]>>;

const EMPTY_TEMPLATE_NUTRITION: MenuNutrition = {
    calories: 0,
    protein: 0,
    fiber: 0,
    fat: 0,
};

function createTemplateMealItem(config: {
    cookTime: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    fat: number;
    fiber: number;
    mealId: number;
    mealName: string;
    mealTime: MenuMealTimeGroup['mealTime'];
    menuItemId: number;
    portionSize?: number;
    protein: number;
    calories: number;
}) {
    const portionSize = config.portionSize ?? 1;

    return {
        menuItemId: config.menuItemId,
        mealId: config.mealId,
        mealName: config.mealName,
        date: '2026-05-08',
        mealTime: config.mealTime,
        portionSize,
        eated: false,
        cookTime: config.cookTime,
        difficulty: config.difficulty,
        nutritionPerServing: {
            calories: config.calories,
            protein: config.protein,
            fiber: config.fiber,
            fat: config.fat,
        },
    } satisfies MenuMealItem;
}

function cloneMealTimeGroups(groups: readonly MenuMealTimeGroup[]) {
    return groups.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
            ...item,
            nutritionPerServing: {
                ...item.nutritionPerServing,
            },
        })),
    }));
}

function calculateNutrition(groups: readonly MenuMealTimeGroup[]) {
    const items = groups.flatMap((group) => group.items);

    return items.length > 0 ? sumMenuMealTimeNutrition(items) : EMPTY_TEMPLATE_NUTRITION;
}

function createTemplateDay(id: string, mealsByTime: TemplateMealItemsByTime = {}): TemplateDayState {
    return {
        id,
        mealTimeGroups: createEmptyMenuMealTimeGroups().map((group) => ({
            ...group,
            items: mealsByTime[group.mealTime]?.map((item) => ({
                ...item,
                nutritionPerServing: {
                    ...item.nutritionPerServing,
                },
            })) ?? [],
        })),
    };
}

function createInitialTemplateDays() {
    return [
        createTemplateDay('day-1', {
            BREAKFAST: [
                createTemplateMealItem({
                    menuItemId: 101,
                    mealId: 11,
                    mealName: 'Avocado Toast',
                    mealTime: 'BREAKFAST',
                    calories: 540,
                    protein: 12,
                    fiber: 10,
                    fat: 32,
                    cookTime: '30 min',
                    difficulty: 'Easy',
                }),
                createTemplateMealItem({
                    menuItemId: 102,
                    mealId: 12,
                    mealName: 'Scrambled Eggs',
                    mealTime: 'BREAKFAST',
                    calories: 290,
                    protein: 22,
                    fiber: 2,
                    fat: 18,
                    cookTime: '20 min',
                    difficulty: 'Easy',
                }),
            ],
        }),
        createTemplateDay('day-2', {
            LUNCH: [
                createTemplateMealItem({
                    menuItemId: 201,
                    mealId: 21,
                    mealName: 'Chicken Rice Bowl',
                    mealTime: 'LUNCH',
                    calories: 720,
                    protein: 40,
                    fiber: 8,
                    fat: 24,
                    cookTime: '35 min',
                    difficulty: 'Medium',
                }),
            ],
            DINNER: [
                createTemplateMealItem({
                    menuItemId: 202,
                    mealId: 22,
                    mealName: 'Salmon with Greens',
                    mealTime: 'DINNER',
                    calories: 610,
                    protein: 36,
                    fiber: 9,
                    fat: 28,
                    cookTime: '30 min',
                    difficulty: 'Medium',
                }),
            ],
        }),
        createTemplateDay('day-3', {
            BREAKFAST: [
                createTemplateMealItem({
                    menuItemId: 301,
                    mealId: 31,
                    mealName: 'Berry Yogurt Bowl',
                    mealTime: 'BREAKFAST',
                    calories: 380,
                    protein: 18,
                    fiber: 7,
                    fat: 12,
                    cookTime: '15 min',
                    difficulty: 'Easy',
                }),
            ],
            LUNCH: [
                createTemplateMealItem({
                    menuItemId: 302,
                    mealId: 32,
                    mealName: 'Pesto Pasta',
                    mealTime: 'LUNCH',
                    calories: 670,
                    protein: 19,
                    fiber: 6,
                    fat: 26,
                    cookTime: '25 min',
                    difficulty: 'Medium',
                }),
            ],
            DINNER: [
                createTemplateMealItem({
                    menuItemId: 303,
                    mealId: 33,
                    mealName: 'Tofu Stir Fry',
                    mealTime: 'DINNER',
                    calories: 560,
                    protein: 27,
                    fiber: 11,
                    fat: 20,
                    cookTime: '25 min',
                    difficulty: 'Medium',
                }),
            ],
        }),
    ];
}

export default function CreateTemplateScreen() {
    const router = useRouter();
    const nextDaySequenceRef = useRef(4);
    const [templateName, setTemplateName] = useState('');
    const [description, setDescription] = useState('');
    const [days, setDays] = useState<TemplateDayState[]>(createInitialTemplateDays);
    const [selectedDayId, setSelectedDayId] = useState('day-1');
    const [copiedDayMealGroups, setCopiedDayMealGroups] = useState<MenuMealTimeGroup[] | null>(null);

    const selectedDay = useMemo(
        () => days.find((day) => day.id === selectedDayId) ?? days[0],
        [days, selectedDayId],
    );
    const totalNutrition = useMemo(
        () => calculateNutrition(days.flatMap((day) => day.mealTimeGroups)),
        [days],
    );
    const selectedDayNutrition = useMemo(
        () => calculateNutrition(selectedDay?.mealTimeGroups ?? []),
        [selectedDay],
    );
    const canDeleteDay = days.length > 1;
    const canCreateTemplate = templateName.trim().length > 0;

    const handleAddDay = useCallback(() => {
        const nextDayId = `day-${nextDaySequenceRef.current}`;

        nextDaySequenceRef.current += 1;
        setDays((currentDays) => [
            ...currentDays,
            {
                id: nextDayId,
                mealTimeGroups: createEmptyMenuMealTimeGroups(),
            },
        ]);
        setSelectedDayId(nextDayId);
    }, []);

    const handleCopyDay = useCallback(() => {
        if (!selectedDay) {
            return;
        }

        setCopiedDayMealGroups(cloneMealTimeGroups(selectedDay.mealTimeGroups));
    }, [selectedDay]);

    const handlePasteDay = useCallback(() => {
        if (!selectedDay || !copiedDayMealGroups) {
            return;
        }

        setDays((currentDays) =>
            currentDays.map((day) =>
                day.id === selectedDay.id
                    ? {
                          ...day,
                          mealTimeGroups: cloneMealTimeGroups(copiedDayMealGroups),
                      }
                    : day,
            ),
        );
    }, [copiedDayMealGroups, selectedDay]);

    const handleDeleteDay = useCallback(() => {
        if (!selectedDay || days.length <= 1) {
            return;
        }

        const selectedDayIndex = days.findIndex((day) => day.id === selectedDay.id);
        const nextDays = days.filter((day) => day.id !== selectedDay.id);
        const fallbackDay = nextDays[Math.min(selectedDayIndex, nextDays.length - 1)];

        setDays(nextDays);
        if (fallbackDay) {
            setSelectedDayId(fallbackDay.id);
        }
    }, [days, selectedDay]);

    const handleAddMeal = useCallback((_mealTime: MenuMealTimeGroup['mealTime']) => undefined, []);

    const handleCreateTemplate = useCallback(() => undefined, []);

    return (
        <YStack f={1} bg="$background">
            <XStack h={72} ai="flex-end" jc="center" pos="relative" w="100%" px="$space.md" pb="$space.sm">
                <XStack
                    pos="absolute"
                    l={16}
                    b={8}
                    p="$xs"
                    br="$radius.sm"
                    onPress={() => router.back()}
                    pressStyle={{ bg: '$surfacePress', opacity: 0.7 }}
                >
                    <ChevronLeft color="$text" size={20} />
                </XStack>
                <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                    Create Template
                </SizableText>
            </XStack>

            <ScrollView f={1} showsVerticalScrollIndicator={false}>
                <YStack w="100%" px="$space.md" pt="$space.md" pb="$space.xl" gap="$space.lg">
                    <MacroStatDetailCard
                        calories={totalNutrition.calories}
                        protein={totalNutrition.protein}
                        fiber={totalNutrition.fiber}
                        fat={totalNutrition.fat}
                    />

                    <YStack w="100%" gap="$space.md">
                        <YStack w="100%" gap="$space.xs">
                            <Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
                                Template Name
                            </Label>
                            <InputText
                                value={templateName}
                                onChangeText={setTemplateName}
                                placeholder="e.g. High Protein Week"
                            />
                        </YStack>

                        <YStack w="100%" gap="$space.xs">
                            <Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
                                Description
                            </Label>
                            <InputTextArea
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Add description of the template..."
                            />
                        </YStack>
                    </YStack>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ overflow: 'visible' }}>
                        <XStack ai="center" gap="$space.sm" pr="$space.sm">
                            {days.map((day, index) => (
                                <DayTab
                                    key={day.id}
                                    label={`Day ${index + 1}`}
                                    isSelected={day.id === selectedDay?.id}
                                    onPress={() => setSelectedDayId(day.id)}
                                />
                            ))}

                            <XStack
                                ai="center"
                                jc="center"
                                px="$space.md"
                                py="$space.sm"
                                br="$radius.pill"
                                bg="$surface"
                                onPress={handleAddDay}
                                pressStyle={{ opacity: 0.86, scale: 0.98, bg: '$surfacePress' }}
                            >
                                <Plus color="$textSubtle" size={16} />
                            </XStack>
                        </XStack>
                    </ScrollView>

                    <XStack w="100%" ai="center" jc="flex-end" gap="$space.sm" flexWrap="wrap">
                        <Button size="medium" color="secondary" onPress={handleCopyDay}>
                            <Button.Icon icon={Copy} />
                            <Button.Text>Copy meals</Button.Text>
                        </Button>

                        <Button
                            size="medium"
                            color="secondary"
                            disabled={!copiedDayMealGroups}
                            onPress={handlePasteDay}
                        >
                            <Button.Icon icon={Clipboard} />
                            <Button.Text>Paste</Button.Text>
                        </Button>

                        <Button size="medium" color="danger" disabled={!canDeleteDay} onPress={handleDeleteDay}>
                            <Button.Icon icon={Trash2} />
                            <Button.Text>Delete</Button.Text>
                        </Button>
                    </XStack>

                    <MacroStatDetailCard
                        calories={selectedDayNutrition.calories}
                        protein={selectedDayNutrition.protein}
                        fiber={selectedDayNutrition.fiber}
                        fat={selectedDayNutrition.fat}
                    />

                    <YStack w="100%" gap="$space.lg">
                        {selectedDay?.mealTimeGroups.map((mealTimeGroup) => (
                            <MenuMealTimeCard
                                key={mealTimeGroup.mealTime}
                                mealTimeGroup={mealTimeGroup}
                                allowAddMeal
                                onAddMeal={handleAddMeal}
                            />
                        ))}
                    </YStack>
                </YStack>
            </ScrollView>

            <YStack w="100%" px="$space.md" pt="$space.sm" pb="$space.lg" bg="$background">
                <Button size="large" color="primary" w="100%" disabled={!canCreateTemplate} onPress={handleCreateTemplate}>
                    <Button.Text>Create</Button.Text>
                </Button>
            </YStack>
        </YStack>
    );
}