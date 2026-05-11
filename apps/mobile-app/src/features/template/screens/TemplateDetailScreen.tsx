import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from '@tamagui/lucide-icons-2';
import { ScrollView, SizableText, XStack, YStack, useTheme } from 'tamagui';

import { Button } from '@components';
import { MacroStatDetailCard } from '@features/menu/components/MacroStatDetailCard';
import { MenuItemDetailModal } from '@features/menu/components/MenuItemDetailModal';
import { MenuMealTimeCard } from '@features/menu/components/MenuMealTimeCard';
import { TemplateActionsMenu } from '@features/template/components/TemplateActionsMenu';
import { DayTab } from '@features/template/components/DayTab';
import type { ApplyTemplateSelection } from '@features/template/components/ApplyTemplateModal';
import { useSession } from '@/providers/AuthProvider';
import { isApiErrorWithStatus } from '@/services/api/http-client';
import {
    applyTemplate,
    buildApplyTemplatePayload,
    deleteTemplate,
    fetchTemplateDetailScreenData,
    type TemplateDetailScreenData,
} from '@features/template/api/template.api';
import type { MenuMealItem, MenuNutrition } from '@features/menu/utils/menu-meal-times';
import { calculateTemplateNutrition } from '@features/template/utils/template-screen-data';
import {
    buildTemplateApplySuccessMessage,
    showTemplateSuccessAlert,
    TEMPLATE_ACTION_SUCCESS_MESSAGES,
} from '@features/template/utils/template-success-alert';

type TemplateDetailScreenState = 'loading' | 'ready' | 'notFound' | 'error';

const EMPTY_TEMPLATE_NUTRITION: MenuNutrition = {
    calories: 0,
    protein: 0,
    fiber: 0,
    fat: 0,
};

function resolveRouteParam(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

function isValidTemplateId(value?: string): value is string {
    if (!value) {
        return false;
    }

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function resolveTemplateDetailErrorMessage(error: unknown, fallbackMessage: string) {
    if (error instanceof Error && error.message.trim()) {
        return error.message.trim();
    }

    return fallbackMessage;
}

export default function TemplateDetailScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { session } = useSession();
    const params = useLocalSearchParams<{ id?: string | string[] }>();
    const templateId = resolveRouteParam(params.id);
    const [templateDetailData, setTemplateDetailData] = useState<TemplateDetailScreenData | null>(null);
    const [screenState, setScreenState] = useState<TemplateDetailScreenState>('loading');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<MenuMealItem | null>(null);
    const [selectedDayUiKey, setSelectedDayUiKey] = useState('');

    const selectedDay = useMemo(
        () => templateDetailData?.days.find((day) => day.uiKey === selectedDayUiKey) ?? templateDetailData?.days[0],
        [selectedDayUiKey, templateDetailData],
    );
    const totalNutrition = useMemo(
        () => templateDetailData?.nutritionTotal ?? EMPTY_TEMPLATE_NUTRITION,
        [templateDetailData],
    );
    const selectedDayNutrition = useMemo(
        () => calculateTemplateNutrition(selectedDay?.mealTimeGroups ?? []),
        [selectedDay],
    );

    const loadTemplateDetail = useCallback(async (config: { isActive: () => boolean }) => {
        if (!isValidTemplateId(templateId)) {
            if (!config.isActive()) {
                return;
            }

            setTemplateDetailData(null);
            setErrorMessage(null);
            setScreenState('notFound');
            return;
        }

        if (!session?.accessToken) {
            if (!config.isActive()) {
                return;
            }

            setTemplateDetailData(null);
            setErrorMessage('Missing access token. Please sign in again.');
            setScreenState('error');
            return;
        }

        if (!config.isActive()) {
            return;
        }

        setScreenState('loading');
        setErrorMessage(null);

        try {
            const nextTemplateDetail = await fetchTemplateDetailScreenData({
                accessToken: session.accessToken,
                templateId,
            });

            if (!config.isActive()) {
                return;
            }

            setTemplateDetailData(nextTemplateDetail);
            setSelectedDayUiKey((currentValue) => {
                if (nextTemplateDetail.days.some((day) => day.uiKey === currentValue)) {
                    return currentValue;
                }

                return nextTemplateDetail.days[0]?.uiKey ?? '';
            });
            setScreenState('ready');
        } catch (error) {
            if (!config.isActive()) {
                return;
            }

            setTemplateDetailData(null);

            if (isApiErrorWithStatus(error, 404)) {
                setErrorMessage(null);
                setScreenState('notFound');
                return;
            }

            setErrorMessage(
                resolveTemplateDetailErrorMessage(error, 'Unable to load template details right now.'),
            );
            setScreenState('error');
        }
    }, [session?.accessToken, templateId]);

    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            void loadTemplateDetail({
                isActive: () => isActive,
            });

            return () => {
                isActive = false;
            };
        }, [loadTemplateDetail]),
    );

    const handleRetry = useCallback(() => {
        let isActive = true;

        void loadTemplateDetail({
            isActive: () => isActive,
        });
    }, [loadTemplateDetail]);

    const handleItemDetailOpenChange = (open: boolean) => {
        if (!open) {
            setSelectedItem(null);
        }
    };

    const handleApplyTemplate = useCallback(
        async (selection: ApplyTemplateSelection) => {
            if (!session?.accessToken) {
                throw new Error('Missing access token. Please sign in again.');
            }

            if (!templateDetailData) {
                throw new Error('Template details are unavailable right now.');
            }

            const response = await applyTemplate({
                accessToken: session.accessToken,
                payload: buildApplyTemplatePayload(selection),
                templateId: templateDetailData.templateId,
            });

            showTemplateSuccessAlert(buildTemplateApplySuccessMessage(response));
        },
        [session?.accessToken, templateDetailData],
    );

    const handleDeleteTemplate = useCallback(async () => {
        if (!session?.accessToken) {
            throw new Error('Missing access token. Please sign in again.');
        }

        if (!templateDetailData) {
            throw new Error('Template details are unavailable right now.');
        }

        await deleteTemplate({
            accessToken: session.accessToken,
            templateId: templateDetailData.templateId,
        });

        showTemplateSuccessAlert(TEMPLATE_ACTION_SUCCESS_MESSAGES.delete);
        router.back();
    }, [router, session?.accessToken, templateDetailData]);

    const renderHeader = () => {
        return (
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
                {screenState === 'ready' && templateDetailData ? (
                    <XStack pos="absolute" r={0}>
                        <TemplateActionsMenu
                            templateId={templateDetailData.templateId}
                            triggerColor="$text"
                            onApplyToDate={handleApplyTemplate}
                            onDelete={handleDeleteTemplate}
                        />
                    </XStack>
                ) : null}
            </XStack>
        );
    };

    if (screenState === 'loading') {
        return (
            <YStack f={1} bg="$background" px="$space.md" pt="$space.md" gap="$space.lg">
                {renderHeader()}
                <YStack f={1} ai="center" jc="center" px="$space.md" gap="$space.sm">
                    <ActivityIndicator color={theme.primary.val} />
                    <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                        Loading template details
                    </SizableText>
                    <SizableText ff="$body" fos="$md" col="$textSubtle" ta="center">
                        Fetching the latest template information from the server.
                    </SizableText>
                </YStack>
            </YStack>
        );
    }

    if (screenState === 'notFound') {
        return (
            <YStack f={1} bg="$background" px="$space.md" pt="$space.md" gap="$space.lg">
                {renderHeader()}
                <YStack f={1} ai="center" jc="center" px="$space.md" gap="$space.sm">
                    <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                        Template not found
                    </SizableText>
                    <SizableText ff="$body" fos="$md" col="$textSubtle" ta="center">
                        The selected template does not exist or is no longer available.
                    </SizableText>
                </YStack>
            </YStack>
        );
    }

    if (screenState === 'error') {
        return (
            <YStack f={1} bg="$background" px="$space.md" pt="$space.md" gap="$space.lg">
                {renderHeader()}
                <YStack f={1} ai="center" jc="center" px="$space.md" gap="$space.md">
                    <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                        Unable to load template details
                    </SizableText>
                    <SizableText ff="$body" fos="$md" col="$danger" ta="center">
                        {errorMessage ?? 'Unable to load template details right now.'}
                    </SizableText>
                    <Button color="secondary" onPress={handleRetry}>
                        <Button.Text>Retry</Button.Text>
                    </Button>
                </YStack>
            </YStack>
        );
    }

    if (!templateDetailData) {
        return null;
    }

    return (
        <YStack f={1} bg="$background" px="$space.md" pt="$space.md" gap="$space.lg">
            {renderHeader()}

            <ScrollView f={1} showsVerticalScrollIndicator={false}>
                <YStack w="100%" pb="$space.xl" gap="$space.lg">
                    <YStack w="100%" gap="$space.xs">
                        <SizableText ff="$heading" fos="$h2" fow="$bold" col="$text">
                            {templateDetailData.title}
                        </SizableText>
                        <SizableText ff="$body" fos="$md" fow="$medium" col="$textSubtle">
                            {templateDetailData.description || 'No description yet.'}
                        </SizableText>
                    </YStack>

                    <MacroStatDetailCard
                        calories={totalNutrition.calories}
                        protein={totalNutrition.protein}
                        fiber={totalNutrition.fiber}
                        fat={totalNutrition.fat}
                    />

                    {templateDetailData.days.length > 0 ? (
                        <>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ overflow: 'visible' }}>
                                <XStack ai="center" gap="$space.sm" pr="$space.sm">
                                    {templateDetailData.days.map((day) => (
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
                        </>
                    ) : (
                        <YStack w="100%" ai="center" jc="center" py="$space.xl" px="$space.md" gap="$space.sm">
                            <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                                No days in this template yet
                            </SizableText>
                            <SizableText ff="$body" fos="$md" col="$textSubtle" ta="center">
                                This template has not been populated with any meal days yet.
                            </SizableText>
                        </YStack>
                    )}
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