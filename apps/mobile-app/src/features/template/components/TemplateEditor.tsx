import { useCallback, useMemo, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronLeft, Clipboard, Copy, Plus, Trash2 } from '@tamagui/lucide-icons-2';
import { Label, ScrollView, SizableText, XStack, YStack } from 'tamagui';

import { Button, InputText, InputTextArea } from '@components';
import { MenuItemDetailModal } from '@features/menu/components/MenuItemDetailModal';
import { MacroStatDetailCard } from '@features/menu/components/MacroStatDetailCard';
import { MenuMealTimeCard } from '@features/menu/components/MenuMealTimeCard';
import { DayTab } from '@features/template/components/DayTab';
import { QuitCreatingTemplateModal } from '@features/template/components/QuitCreatingTemplateModal';
import { QuitEditingTemplateModal } from '@features/template/components/QuitEditingTemplateModal';
import { TemplateImageUploadField } from '@features/template/components/TemplateImageUploadField';
import { removeMenuMealItemFromGroups, replaceMenuMealItemInGroups } from '@features/menu/utils/menu-state';
import {
    calculateTemplateNutrition,
    cloneMealTimeGroups,
    cloneTemplateDays,
    createTemplateEditorMealItem,
    createTemplateDay,
    getNextTemplateMealItemId,
    type TemplateDayState,
    renumberTemplateDays,
} from '@features/template/utils/template-screen-data';
import {
    buildTemplateMealPickerParams,
    clearPendingTemplateMealSelection,
    consumePendingTemplateMealSelection,
} from '@features/template/utils/template-meal-picker';
import { type MenuMealItem, type MenuMealTimeGroup } from '@features/menu/utils/menu-meal-times';
import {
    type TemplateImageMutation,
    type TemplateSelectedImageAsset,
} from '@features/template/api/template-image.api';

const MAX_TEMPLATE_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export interface TemplateEditorDraft {
    description: string;
    days: TemplateDayState[];
    templateImageMutation: TemplateImageMutation;
    templateName: string;
}

export interface TemplateEditorProps {
    headerTitle: string;
    initialDescription: string;
    initialDays: TemplateDayState[];
    initialTemplateImageKey: string | null;
    initialTemplateImageUrl: string | null;
    initialTemplateName: string;
    isSubmitting?: boolean;
    onClearSubmitError?: () => void;
    onSubmitDraft: (draft: TemplateEditorDraft) => Promise<void> | void;
    quitModalVariant: 'create' | 'edit';
    submitLabel: string;
    submitError?: string | null;
    submittingLabel: string;
}

export function TemplateEditor({
    headerTitle,
    initialDescription,
    initialDays,
    initialTemplateImageKey,
    initialTemplateImageUrl,
    initialTemplateName,
    isSubmitting = false,
    onClearSubmitError,
    onSubmitDraft,
    quitModalVariant,
    submitLabel,
    submitError,
    submittingLabel,
}: TemplateEditorProps) {
    const router = useRouter();
    const nextDaySequenceRef = useRef(initialDays.length + 1);
    const nextMenuItemIdRef = useRef(getNextTemplateMealItemId(initialDays));
    const [templateName, setTemplateName] = useState(initialTemplateName);
    const [description, setDescription] = useState(initialDescription);
    const [days, setDays] = useState<TemplateDayState[]>(() => cloneTemplateDays(initialDays));
    const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);
    const [selectedMealItem, setSelectedMealItem] = useState<MenuMealItem | null>(null);
    const [selectedDayUiKey, setSelectedDayUiKey] = useState(() => initialDays[0]?.uiKey ?? '');
    const [copiedDayMealGroups, setCopiedDayMealGroups] = useState<MenuMealTimeGroup[] | null>(null);
    const [selectedTemplateImageAsset, setSelectedTemplateImageAsset] = useState<TemplateSelectedImageAsset | null>(null);
    const [isInitialTemplateImageMarkedForRemoval, setIsInitialTemplateImageMarkedForRemoval] = useState(false);
    const [templateImageErrorMessage, setTemplateImageErrorMessage] = useState<string | null>(null);

    const hasInitialTemplateImage = Boolean(initialTemplateImageKey);

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
    const templateImagePreviewUri = selectedTemplateImageAsset?.uri
        ?? (isInitialTemplateImageMarkedForRemoval ? null : initialTemplateImageUrl);
    const templateImageHelperMessage = selectedTemplateImageAsset
        ? 'This image will be uploaded when you save the template.'
        : isInitialTemplateImageMarkedForRemoval
            ? 'The current cover image will be removed when you save the template.'
            : 'Use a JPG or PNG image up to 5 MB.';
    const showTemplateImageRemoveAction = Boolean(
        selectedTemplateImageAsset || (!isInitialTemplateImageMarkedForRemoval && hasInitialTemplateImage),
    );
    const canDeleteDay = days.length > 1;
    const canSubmit = templateName.trim().length > 0;

    const clearSubmitError = useCallback(() => {
        onClearSubmitError?.();
    }, [onClearSubmitError]);

    useFocusEffect(
        useCallback(() => {
            const selection = consumePendingTemplateMealSelection();

            if (!selection) {
                return;
            }

            clearSubmitError();
            setSelectedDayUiKey(selection.dayUiKey);
            setDays((currentDays) => {
                const targetDay = currentDays.find((day) => day.uiKey === selection.dayUiKey);

                if (!targetDay) {
                    return currentDays;
                }

                const nextMenuItemId = nextMenuItemIdRef.current;
                nextMenuItemIdRef.current += 1;

                return currentDays.map((day) =>
                    day.uiKey !== selection.dayUiKey
                        ? day
                        : {
                              ...day,
                              mealTimeGroups: day.mealTimeGroups.map((group) =>
                                  group.mealTime !== selection.mealTime
                                      ? group
                                      : {
                                            ...group,
                                            items: [
                                                ...group.items,
                                                createTemplateEditorMealItem({
                                                    cookTime: selection.cookTime,
                                                    dayNumber: day.dayNumber,
                                                    difficulty: selection.difficulty,
                                                    mealId: selection.mealId,
                                                    mealName: selection.mealName,
                                                    mealTime: selection.mealTime,
                                                    menuItemId: nextMenuItemId,
                                                    nutritionPerServing: selection.nutritionPerServing,
                                                }),
                                            ],
                                        },
                              ),
                          },
                );
            });
        }, [clearSubmitError]),
    );

    const handleTemplateNameChange = useCallback(
        (value: string) => {
            clearSubmitError();
            setTemplateName(value);
        },
        [clearSubmitError],
    );

    const handleDescriptionChange = useCallback(
        (value: string) => {
            clearSubmitError();
            setDescription(value);
        },
        [clearSubmitError],
    );

    const handlePickTemplateImage = useCallback(async () => {
        if (isSubmitting) {
            return;
        }

        clearSubmitError();
        setTemplateImageErrorMessage(null);

        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permissionResult.granted) {
                setTemplateImageErrorMessage('Permission to access the media library is required to choose a cover image.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 1,
            });

            if (result.canceled) {
                return;
            }

            const asset = result.assets[0];
            if (!asset) {
                setTemplateImageErrorMessage('Unable to read the selected image.');
                return;
            }

            const nextTemplateImageAsset = mapPickedTemplateImageAsset(asset);
            setSelectedTemplateImageAsset(nextTemplateImageAsset);
            setIsInitialTemplateImageMarkedForRemoval(false);
        } catch (error) {
            setTemplateImageErrorMessage(
                resolveTemplateImagePickerErrorMessage(error, 'Unable to choose an image right now.'),
            );
        }
    }, [clearSubmitError, isSubmitting]);

    const handleRemoveTemplateImage = useCallback(() => {
        clearSubmitError();
        setTemplateImageErrorMessage(null);

        if (selectedTemplateImageAsset) {
            setSelectedTemplateImageAsset(null);
            return;
        }

        if (hasInitialTemplateImage) {
            setIsInitialTemplateImageMarkedForRemoval(true);
        }
    }, [clearSubmitError, hasInitialTemplateImage, selectedTemplateImageAsset]);

    const handleAddDay = useCallback(() => {
        if (isSubmitting) {
            return;
        }

        const nextDayUiKey = `template-day-${nextDaySequenceRef.current}`;

        nextDaySequenceRef.current += 1;
        clearSubmitError();
        setDays((currentDays) => {
            const nextDay = createTemplateDay({
                dayNumber: currentDays.length + 1,
                uiKey: nextDayUiKey,
            });

            return [...currentDays, nextDay];
        });
        setSelectedDayUiKey(nextDayUiKey);
    }, [clearSubmitError, isSubmitting]);

    const handleCopyDay = useCallback(() => {
        if (isSubmitting) {
            return;
        }

        if (!selectedDay) {
            return;
        }

        setCopiedDayMealGroups(cloneMealTimeGroups(selectedDay.mealTimeGroups));
    }, [selectedDay]);

    const handlePasteDay = useCallback(() => {
        if (isSubmitting) {
            return;
        }

        if (!selectedDay || !copiedDayMealGroups) {
            return;
        }

        clearSubmitError();
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
    }, [clearSubmitError, copiedDayMealGroups, isSubmitting, selectedDay]);

    const handleDeleteDay = useCallback(() => {
        if (isSubmitting) {
            return;
        }

        if (!selectedDay || days.length <= 1) {
            return;
        }

        const selectedDayIndex = days.findIndex((day) => day.uiKey === selectedDay.uiKey);
        const nextDays = renumberTemplateDays(days.filter((day) => day.uiKey !== selectedDay.uiKey));
        const fallbackDay = nextDays[Math.min(selectedDayIndex, nextDays.length - 1)];

        clearSubmitError();
        setDays(nextDays);
        if (fallbackDay) {
            setSelectedDayUiKey(fallbackDay.uiKey);
        }
    }, [clearSubmitError, days, isSubmitting, selectedDay]);

    const handleAddMeal = useCallback(
        (mealTime: MenuMealTimeGroup['mealTime']) => {
            if (isSubmitting || !selectedDay) {
                return;
            }

            clearPendingTemplateMealSelection();
            clearSubmitError();
            router.push({
                pathname: '/meal-search',
                params: buildTemplateMealPickerParams({
                    source: 'template',
                    dayNumber: selectedDay.dayNumber,
                    dayUiKey: selectedDay.uiKey,
                    existingMealIds: Array.from(
                        new Set(
                            selectedDay.mealTimeGroups
                                .find((group) => group.mealTime === mealTime)
                                ?.items.map((item) => item.mealId) ?? [],
                        ),
                    ),
                    mealTime,
                }),
            });
        },
        [clearSubmitError, isSubmitting, router, selectedDay],
    );
    const handleItemDetailOpenChange = useCallback((open: boolean) => {
        if (!open) {
            setSelectedMealItem(null);
        }
    }, []);
    const handleSaveMealItem = useCallback((item: MenuMealItem, portionSize: number) => {
        clearSubmitError();
        setDays((currentDays) =>
            currentDays.map((day) => ({
                ...day,
                mealTimeGroups: replaceMenuMealItemInGroups(day.mealTimeGroups, {
                    ...item,
                    portionSize,
                }),
            })),
        );
    }, [clearSubmitError]);
    const handleDeleteMealItem = useCallback((item: MenuMealItem) => {
        clearSubmitError();
        setDays((currentDays) =>
            currentDays.map((day) => ({
                ...day,
                mealTimeGroups: removeMenuMealItemFromGroups(day.mealTimeGroups, item.menuItemId),
            })),
        );
    }, [clearSubmitError]);
    const handleConfirmQuit = useCallback(() => {
        setIsQuitModalOpen(false);
        router.back();
    }, [router]);
    const handleRequestBack = useCallback(() => {
        if (isSubmitting) {
            return;
        }

        setIsQuitModalOpen(true);
    }, [isSubmitting]);
    const handleSubmit = useCallback(async () => {
        if (!canSubmit || isSubmitting) {
            return;
        }

        await onSubmitDraft({
            description,
            days: cloneTemplateDays(days),
            templateImageMutation: buildTemplateImageMutation({
                currentImageKey: initialTemplateImageKey,
                isMarkedForRemoval: isInitialTemplateImageMarkedForRemoval,
                selectedImageAsset: selectedTemplateImageAsset,
            }),
            templateName,
        });
    }, [
        canSubmit,
        days,
        description,
        initialTemplateImageKey,
        isInitialTemplateImageMarkedForRemoval,
        isSubmitting,
        onSubmitDraft,
        selectedTemplateImageAsset,
        templateName,
    ]);

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

            <ScrollView f={1} showsVerticalScrollIndicator={false}>
                <YStack w="100%" gap="$space.lg" py="$space.md">
                    <MacroStatDetailCard
                        calories={totalNutrition.calories}
                        protein={totalNutrition.protein}
                        fiber={totalNutrition.fiber}
                        fat={totalNutrition.fat}
                    />

                    <TemplateImageUploadField
                        errorMessage={templateImageErrorMessage}
                        helperMessage={templateImageHelperMessage}
                        isDisabled={isSubmitting}
                        onPickImage={() => void handlePickTemplateImage()}
                        onRemoveImage={handleRemoveTemplateImage}
                        previewUri={templateImagePreviewUri}
                        showRemoveAction={showTemplateImageRemoveAction}
                    />

                    <YStack w="100%" gap="$space.md">
                        <YStack w="100%" gap="$space.xs">
                            <Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
                                Template Name
                            </Label>
                            <InputText
                                value={templateName}
                                onChangeText={handleTemplateNameChange}
                                placeholder="e.g. High Protein Week"
                            />
                        </YStack>

                        <YStack w="100%" gap="$space.xs">
                            <Label ff="$body" fos="$md" fow="$medium" col="$textSubtle">
                                Description
                            </Label>
                            <InputTextArea
                                value={description}
                                onChangeText={handleDescriptionChange}
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
                            disabled={isSubmitting || !copiedDayMealGroups}
                            onPress={handlePasteDay}
                        >
                            <Button.Icon icon={Clipboard} />
                            <Button.Text>Paste</Button.Text>
                        </Button>

                        <Button
                            size="medium"
                            color="danger"
                            disabled={isSubmitting || !canDeleteDay}
                            onPress={handleDeleteDay}
                        >
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
                {submitError ? (
                    <SizableText ff="$body" fos="$sm" col="$danger" mb="$space.sm">
                        {submitError}
                    </SizableText>
                ) : null}

                <Button
                    size="large"
                    color="primary"
                    w="100%"
                    disabled={isSubmitting || !canSubmit}
                    onPress={() => void handleSubmit()}
                >
                    <Button.Text>{isSubmitting ? submittingLabel : submitLabel}</Button.Text>
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

function buildTemplateImageMutation(config: {
    currentImageKey: string | null;
    isMarkedForRemoval: boolean;
    selectedImageAsset: TemplateSelectedImageAsset | null;
}): TemplateImageMutation {
    if (config.selectedImageAsset) {
        return {
            kind: 'replace',
            asset: config.selectedImageAsset,
            currentImageKey: config.currentImageKey,
        };
    }

    if (config.isMarkedForRemoval && config.currentImageKey) {
        return {
            kind: 'remove',
            currentImageKey: config.currentImageKey,
        };
    }

    return {
        kind: 'keep',
        currentImageKey: config.currentImageKey,
    };
}

function mapPickedTemplateImageAsset(
    asset: ImagePicker.ImagePickerAsset,
): TemplateSelectedImageAsset {
    const mimeType = resolveTemplateImageMimeType(asset);

    if (asset.fileSize != null && asset.fileSize > MAX_TEMPLATE_IMAGE_FILE_SIZE_BYTES) {
        throw new Error('Selected image must be 5 MB or smaller.');
    }

    return {
        fileName: asset.fileName ?? null,
        fileSize: asset.fileSize ?? null,
        height: asset.height,
        mimeType,
        uri: asset.uri,
        width: asset.width,
    };
}

function resolveTemplateImageMimeType(
    asset: Pick<ImagePicker.ImagePickerAsset, 'fileName' | 'mimeType' | 'uri'>,
): 'image/jpeg' | 'image/jpg' | 'image/png' {
    const normalizedMimeType = asset.mimeType?.trim().toLowerCase();

    if (
        normalizedMimeType === 'image/jpeg'
        || normalizedMimeType === 'image/jpg'
        || normalizedMimeType === 'image/png'
    ) {
        return normalizedMimeType;
    }

    const normalizedFileName = asset.fileName?.trim().toLowerCase() ?? asset.uri.trim().toLowerCase();
    if (normalizedFileName.endsWith('.png')) {
        return 'image/png';
    }

    if (normalizedFileName.endsWith('.jpg')) {
        return 'image/jpg';
    }

    if (normalizedFileName.endsWith('.jpeg')) {
        return 'image/jpeg';
    }

    throw new Error('Please choose a JPG or PNG image.');
}

function resolveTemplateImagePickerErrorMessage(error: unknown, fallbackMessage: string) {
    if (error instanceof Error && error.message.trim()) {
        return error.message.trim();
    }

    return fallbackMessage;
}