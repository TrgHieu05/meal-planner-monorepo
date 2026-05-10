import { useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from '@tamagui/lucide-icons-2';
import { ScrollView, SizableText, XStack, YStack } from 'tamagui';

import { MacroStatDetailCard } from '@features/menu/components/MacroStatDetailCard';
import { MenuItemDetailModal } from '@features/menu/components/MenuItemDetailModal';
import { MenuMealTimeCard } from '@features/menu/components/MenuMealTimeCard';
import { TemplateActionsMenu } from '@features/template/components/TemplateActionsMenu';
import { DayTab } from '@features/template/components/DayTab';
import type { MenuMealItem } from '@features/menu/utils/menu-meal-times';
import { calculateTemplateNutrition, createTemplateDraftSeed } from '@features/template/utils/template-screen-data';

function resolveRouteParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

export default function TemplateDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ id?: string | string[] }>();
    const templateId = resolveRouteParam(params.id) ?? 'sample-template';
    const templateDetailDraft = useMemo(() => createTemplateDraftSeed(), []);
    const [selectedItem, setSelectedItem] = useState<MenuMealItem | null>(null);
    const [selectedDayUiKey, setSelectedDayUiKey] = useState(() => templateDetailDraft.days[0]?.uiKey ?? '');

    const selectedDay = useMemo(
        () => templateDetailDraft.days.find((day) => day.uiKey === selectedDayUiKey) ?? templateDetailDraft.days[0],
        [selectedDayUiKey, templateDetailDraft],
    );
    const totalNutrition = useMemo(
        () => calculateTemplateNutrition(templateDetailDraft.days.flatMap((day) => day.mealTimeGroups)),
        [templateDetailDraft],
    );
    const selectedDayNutrition = useMemo(
        () => calculateTemplateNutrition(selectedDay?.mealTimeGroups ?? []),
        [selectedDay],
    );

    const handleItemDetailOpenChange = (open: boolean) => {
        if (!open) {
            setSelectedItem(null);
        }
    };

    return (
        <YStack f={1} bg="$background" px="$space.md" pt="$space.md" gap="$space.lg">

            <XStack h={40} ai="center" jc="center" pos="relative" w="100%">
                <XStack
                    pos="absolute"
                    l={0}
                    p="$xs"
                    onPress={() => router.back()}
                    pressStyle={{ bg: '$surfacePress', opacity: 0.7 }}
                >
                    <ChevronLeft color="$text" size={20} />
                </XStack>
                <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                    Template Details
                </SizableText>
                <XStack pos="absolute" r={0}>
                    <TemplateActionsMenu templateId={templateId} triggerColor="$text" />
                </XStack>
            </XStack>


            <ScrollView f={1} showsVerticalScrollIndicator={false}>
                <YStack w="100%" pb="$space.xl" gap="$space.lg">
                    <YStack w="100%" gap="$space.xs">
                        <SizableText ff="$heading" fos="$h2" fow="$bold" col="$text">
                            {templateDetailDraft.name}
                        </SizableText>
                        <SizableText ff="$body" fos="$md" fow="$medium" col="$textSubtle">
                            {templateDetailDraft.description}
                        </SizableText>
                    </YStack>

                    <MacroStatDetailCard
                        calories={totalNutrition.calories}
                        protein={totalNutrition.protein}
                        fiber={totalNutrition.fiber}
                        fat={totalNutrition.fat}
                    />

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ overflow: 'visible' }}>
                        <XStack ai="center" gap="$space.sm" pr="$space.sm">
                            {templateDetailDraft.days.map((day) => (
                                <DayTab
                                    key={day.uiKey}
                                    label={`Day ${day.dayNumber}`}
                                    isSelected={day.uiKey === selectedDay?.uiKey}
                                    onPress={() => setSelectedDayUiKey(day.uiKey)}
                                />
                            ))}
                        </XStack>
                    </ScrollView>

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
                                allowAddMeal={false}
                                onItemPress={setSelectedItem}
                            />
                        ))}
                    </YStack>
                </YStack>
            </ScrollView>

            <MenuItemDetailModal
                item={selectedItem}
                mode="template-detail"
                open={selectedItem !== null}
                onOpenChange={handleItemDetailOpenChange}
            />
        </YStack>
    );
}