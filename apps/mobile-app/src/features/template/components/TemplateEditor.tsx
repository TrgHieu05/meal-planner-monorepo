import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { ChevronLeft, Clipboard, Copy, Plus, Trash2 } from '@tamagui/lucide-icons-2';
import { Label, ScrollView, SizableText, XStack, YStack } from 'tamagui';

import { Button, InputText, InputTextArea } from '@components';
import { MenuItemDetailModal } from '@features/menu/components/MenuItemDetailModal';
import { MacroStatDetailCard } from '@features/menu/components/MacroStatDetailCard';
import { MenuMealTimeCard } from '@features/menu/components/MenuMealTimeCard';
import { DayTab } from '@features/template/components/DayTab';
import { QuitCreatingTemplateModal } from '@features/template/components/QuitCreatingTemplateModal';
import { QuitEditingTemplateModal } from '@features/template/components/QuitEditingTemplateModal';
import { removeMenuMealItemFromGroups, replaceMenuMealItemInGroups } from '@features/menu/utils/menu-state';
import {
    calculateTemplateNutrition,
    cloneMealTimeGroups,
    cloneTemplateDays,
    createTemplateDay,
    type TemplateDayState,
    renumberTemplateDays,
} from '@features/template/utils/template-screen-data';
import { type MenuMealItem, type MenuMealTimeGroup } from '@features/menu/utils/menu-meal-times';

export interface TemplateEditorProps {
    headerTitle: string;
    initialDescription: string;
    initialDays: TemplateDayState[];
    initialTemplateName: string;
    quitModalVariant: 'create' | 'edit';
    submitLabel: string;
}

export function TemplateEditor({
    headerTitle,
    initialDescription,
    initialDays,
    initialTemplateName,
    quitModalVariant,
    submitLabel,
}: TemplateEditorProps) {
    const router = useRouter();
    const nextDaySequenceRef = useRef(initialDays.length + 1);
    const [templateName, setTemplateName] = useState(initialTemplateName);
    const [description, setDescription] = useState(initialDescription);
    const [days, setDays] = useState<TemplateDayState[]>(() => cloneTemplateDays(initialDays));
    const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);
    const [selectedMealItem, setSelectedMealItem] = useState<MenuMealItem | null>(null);
    const [selectedDayUiKey, setSelectedDayUiKey] = useState(() => initialDays[0]?.uiKey ?? '');
    const [copiedDayMealGroups, setCopiedDayMealGroups] = useState<MenuMealTimeGroup[] | null>(null);

    const selectedDay = useMemo(
        () => days.find((day) => day.uiKey === selectedDayUiKey) ?? days[0],
        [days, selectedDayUiKey],
    );
    const totalNutrition = useMemo(
        () => calculateTemplateNutrition(days.flatMap((day) => day.mealTimeGroups)),
        [days],
    );
    const selectedDayNutrition = useMemo(
        () => calculateTemplateNutrition(selectedDay?.mealTimeGroups ?? []),
        [selectedDay],
    );
    const canDeleteDay = days.length > 1;
    const canSubmit = templateName.trim().length > 0;

    const handleAddDay = useCallback(() => {
        const nextDayUiKey = `template-day-${nextDaySequenceRef.current}`;

        nextDaySequenceRef.current += 1;
        setDays((currentDays) => {
            const nextDay = createTemplateDay({
                dayNumber: currentDays.length + 1,
                uiKey: nextDayUiKey,
            });

            return [...currentDays, nextDay];
        });
        setSelectedDayUiKey(nextDayUiKey);
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
                day.uiKey === selectedDay.uiKey
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

        const selectedDayIndex = days.findIndex((day) => day.uiKey === selectedDay.uiKey);
        const nextDays = renumberTemplateDays(days.filter((day) => day.uiKey !== selectedDay.uiKey));
        const fallbackDay = nextDays[Math.min(selectedDayIndex, nextDays.length - 1)];

        setDays(nextDays);
        if (fallbackDay) {
            setSelectedDayUiKey(fallbackDay.uiKey);
        }
    }, [days, selectedDay]);

    const handleAddMeal = useCallback((_mealTime: MenuMealTimeGroup['mealTime']) => undefined, []);
    const handleItemDetailOpenChange = useCallback((open: boolean) => {
        if (!open) {
            setSelectedMealItem(null);
        }
    }, []);
    const handleSaveMealItem = useCallback((item: MenuMealItem, portionSize: number) => {
        setDays((currentDays) =>
            currentDays.map((day) => ({
                ...day,
                mealTimeGroups: replaceMenuMealItemInGroups(day.mealTimeGroups, {
                    ...item,
                    portionSize,
                }),
            })),
        );
    }, []);
    const handleDeleteMealItem = useCallback((item: MenuMealItem) => {
        setDays((currentDays) =>
            currentDays.map((day) => ({
                ...day,
                mealTimeGroups: removeMenuMealItemFromGroups(day.mealTimeGroups, item.menuItemId),
            })),
        );
    }, []);
    const handleConfirmQuit = useCallback(() => {
        setIsQuitModalOpen(false);
        router.back();
    }, [router]);
    const handleRequestBack = useCallback(() => {
        setIsQuitModalOpen(true);
    }, []);
    const handleSubmit = useCallback(() => undefined, []);

    return (
        <YStack f={1} bg="$background" px="$space.md" pt="$space.md" gap="space.lg"  >

            <XStack h={40} ai="center" jc="center" pos="relative" bg="$background" w="100%" zIndex={1}>
                <XStack
                    pos="absolute"
                    l={0}
                    p="$xs"
                    br="$radius.sm"
                    onPress={handleRequestBack}
                    pressStyle={{ bg: '$surfacePress'}}
                >
                    <ChevronLeft color="$text" size={20} />
                </XStack>
                <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                    {headerTitle}
                </SizableText>
            </XStack>

            <ScrollView f={1} showsVerticalScrollIndicator={false} overflowX='visible'>
                <YStack w="100%" gap="$space.lg" py="$space.md">
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
                                    key={day.uiKey}
                                    label={`Day ${day.dayNumber}`}
                                    isSelected={day.uiKey === selectedDay?.uiKey}
                                    onPress={() => setSelectedDayUiKey(day.uiKey)}
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
                                onItemPress={setSelectedMealItem}
                            />
                        ))}
                    </YStack>
                </YStack>
            </ScrollView>

            <YStack w="100%" py="$space.md" bg="$background">
                <Button size="large" color="primary" w="100%" disabled={!canSubmit} onPress={handleSubmit}>
                    <Button.Text>{submitLabel}</Button.Text>
                </Button>
            </YStack>

            <MenuItemDetailModal
                item={selectedMealItem}
                mode="template-edit"
                open={selectedMealItem !== null}
                onOpenChange={handleItemDetailOpenChange}
                onDelete={handleDeleteMealItem}
                onSave={handleSaveMealItem}
            />

            {quitModalVariant === 'create' ? (
                <QuitCreatingTemplateModal
                    open={isQuitModalOpen}
                    onOpenChange={setIsQuitModalOpen}
                    onConfirm={handleConfirmQuit}
                />
            ) : (
                <QuitEditingTemplateModal
                    open={isQuitModalOpen}
                    onOpenChange={setIsQuitModalOpen}
                    onConfirm={handleConfirmQuit}
                />
            )}
        </YStack>
    );
}