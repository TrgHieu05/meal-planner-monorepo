import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import { ArrowRight, Clock3, Check, Trash2, Utensils } from '@tamagui/lucide-icons-2';
import { useRouter } from 'expo-router';
import { SizableText, XStack, YStack } from 'tamagui';

import { Button, InputText, Tag } from '@components';
import { useSession } from '@/providers/AuthProvider';
import { fetchMealDetailViewModel } from '@features/meal/api/meal.api';
import { MacroStatDetailCard } from './MacroStatDetailCard';
import {
  isPastCalendarDate,
  scaleMenuNutrition,
  type MenuMealItem,
} from '@features/menu/utils/menu-meal-times';
import {
  parseMenuFlowDateParam,
  toMenuFlowMealTimeParam,
} from '@features/menu/utils/menu-flow';
import { parsePositivePortionSize } from '@features/menu/utils/menu-state';
import { createTodayCalendarDate } from '@features/menu/utils/week-date';
import {
  MENU_ACTION_SUCCESS_MESSAGES,
  showMenuSuccessAlert,
} from '@features/menu/utils/menu-success-alert';

export interface MenuItemDetailModalProps {
  item: MenuMealItem | null;
  mode?: 'menu' | 'template-detail' | 'template-edit';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (item: MenuMealItem) => Promise<void> | void;
  onLog?: (item: MenuMealItem) => Promise<void> | void;
  onSave?: (item: MenuMealItem, portionSize: number) => Promise<void> | void;
}

function ActionIconButton({
  icon: Icon,
  backgroundColor,
  iconColor,
  onPress,
}: {
  icon: React.ElementType<{ color?: string; size?: number }>;
  backgroundColor: string;
  iconColor: string;
  onPress?: () => void;
}) {
  return (
    <XStack
      w={40}
      h={40}
      ai="center"
      jc="center"
      bg={backgroundColor}
      br="$radius.md"
      onPress={onPress}
      pressStyle={{ opacity: 0.86, scale: 0.98 }}
    >
      <Icon color={iconColor} size={18} />
    </XStack>
  );
}

export function MenuItemDetailModal({
  item,
  mode = 'menu',
  open,
  onOpenChange,
  onDelete,
  onLog,
  onSave,
}: MenuItemDetailModalProps) {
  const router = useRouter();
  const { session } = useSession();
  const today = useMemo(() => createTodayCalendarDate(), []);
  const [draftPortionSize, setDraftPortionSize] = useState('1');
  const [portionSizeError, setPortionSizeError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchedCookTime, setFetchedCookTime] = useState<string | null>(null);
  const [fetchedDifficulty, setFetchedDifficulty] = useState<string | null>(null);
  const [mealDetailError, setMealDetailError] = useState<string | null>(null);
  const isReadOnlyMode = mode === 'template-detail';
  const isTemplateMode = mode !== 'menu';

  useEffect(() => {
    if (!open || !item) {
      return;
    }

    setDraftPortionSize(`${item.portionSize}`);
    setPortionSizeError(null);
    setSubmitError(null);
    setFetchedCookTime(item.cookTime ?? null);
    setFetchedDifficulty(item.difficulty ?? null);
    setMealDetailError(null);
  }, [item, open]);

  useEffect(() => {
    if (!open || !item) {
      return;
    }

    if ((item.cookTime && item.difficulty) || !session?.accessToken) {
      return;
    }

    let isActive = true;
    setMealDetailError(null);

    void (async () => {
      try {
        const mealDetail = await fetchMealDetailViewModel({
          accessToken: session.accessToken,
          mealId: item.mealId,
        });

        if (!isActive) {
          return;
        }

        setFetchedCookTime(mealDetail.cookTime);
        setFetchedDifficulty(mealDetail.difficulty);
      } catch (error) {
        if (!isActive) {
          return;
        }

        setMealDetailError(resolveActionErrorMessage(error, 'Unable to load meal details right now.'));
      }
    })();

    return () => {
      isActive = false;
    };
  }, [item, open, session?.accessToken]);

  const previewPortionSize = useMemo(() => {
    if (!item) {
      return 1;
    }

    return parsePositivePortionSize(draftPortionSize) ?? item.portionSize;
  }, [draftPortionSize, item]);

  const nutrition = useMemo(() => {
    if (!item) {
      return null;
    }

    return scaleMenuNutrition(item.nutritionPerServing, previewPortionSize);
  }, [item, previewPortionSize]);

  const resolvedCookTime = item?.cookTime ?? fetchedCookTime;
  const resolvedDifficulty = item?.difficulty ?? fetchedDifficulty;
  const isPastMenuDate = useMemo(() => {
    if (mode !== 'menu') {
      return false;
    }

    if (!item) {
      return false;
    }

    const itemDate = parseMenuFlowDateParam(item.date);

    return itemDate ? isPastCalendarDate(itemDate, today) : false;
  }, [item, today]);

  if (!item || !nutrition) {
    return null;
  }

  const canEditPortionSize = !isReadOnlyMode && !isPastMenuDate && !isSubmitting;
  const canDeleteItem = !isReadOnlyMode && Boolean(onDelete) && !isPastMenuDate;
  const canLogItem = !isTemplateMode && Boolean(onLog) && !isPastMenuDate;
  const showActionSection = !isReadOnlyMode;
  const showSaveButton = !isReadOnlyMode && Boolean(onSave) && !isPastMenuDate;

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    onOpenChange(false);
  };

  const handleDraftPortionSizeChange = (value: string) => {
    setDraftPortionSize(value);
    setPortionSizeError(null);
    setSubmitError(null);
  };

  const runMutation = async (
    action: () => Promise<void> | void,
    successMessage?: string,
  ) => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await action();
      onOpenChange(false);
      if (successMessage) {
        showMenuSuccessAlert(successMessage);
      }
    } catch (error) {
      setSubmitError(resolveActionErrorMessage(error, 'Unable to update this menu item right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = () => {
    if (isPastMenuDate || !onSave) {
      return;
    }

    const resolvedPortionSize = parsePositivePortionSize(draftPortionSize);

    if (resolvedPortionSize == null) {
      setPortionSizeError('Portion size must be greater than 0.');
      return;
    }

    void runMutation(
      async () => {
        await onSave?.(item, resolvedPortionSize);
      },
      MENU_ACTION_SUCCESS_MESSAGES.updateItem,
    );
  };

  const handleDelete = () => {
    if (isPastMenuDate || !onDelete) {
      return;
    }

    void runMutation(
      async () => {
        await onDelete?.(item);
      },
      MENU_ACTION_SUCCESS_MESSAGES.deleteItem,
    );
  };

  const handleLog = () => {
    if (isPastMenuDate || !onLog) {
      return;
    }

    void runMutation(
      async () => {
        await onLog?.(item);
      },
      item.eated
        ? MENU_ACTION_SUCCESS_MESSAGES.updateItem
        : MENU_ACTION_SUCCESS_MESSAGES.logItem,
    );
  };

  const handleNavigateToMealDetail = () => {
    onOpenChange(false);
    router.push({
      pathname: '/meal-search/[mealId]',
      params: {
        mealId: `${item.mealId}`,
        mealTime: toMenuFlowMealTimeParam(item.mealTime),
        date: item.date,
      },
    });
  };

  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={handleClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <YStack f={1} ai="center" jc="center" px="$space.md">
          <Pressable
            style={styles.cardWrap}
            onPress={(event) => {
              event.stopPropagation();
            }}
          >
            <YStack w="100%" maw={360} bg="$background" br="$radius.xl" px="$space.md" py="$space.lg" gap="$space.lg">
              <SizableText ff="$heading" fos="$h3" fow="$bold" col="$text" ta="center" w="100%">
                {item.mealName}
              </SizableText>

              <MacroStatDetailCard
                calories={nutrition.calories}
                protein={nutrition.protein}
                fiber={nutrition.fiber}
                fat={nutrition.fat}
              />

              <XStack gap="$space.sm" flexWrap="wrap">
                {resolvedCookTime ? (
                  <Tag>
                    <Tag.Icon icon={Clock3} size={16} />
                    <Tag.Text>{resolvedCookTime}</Tag.Text>
                  </Tag>
                ) : null}
                {resolvedDifficulty ? (
                  <Tag>
                    <Tag.Icon icon={Utensils} size={16} />
                    <Tag.Text>{resolvedDifficulty}</Tag.Text>
                  </Tag>
                ) : null}
                {!isTemplateMode ? (
                  <Tag status={item.eated ? 'brand' : 'danger'}>
                    <Tag.Icon icon={Check} size={16} />
                    <Tag.Text>{item.eated ? 'Logged' : 'Not logged'}</Tag.Text>
                  </Tag>
                ) : null}
              </XStack>

              {mealDetailError ? (
                <SizableText ff="$body" fos="$sm" col="$danger">
                  {mealDetailError}
                </SizableText>
              ) : null}

              <YStack w="100%" gap="$space.xs">
                <SizableText ff="$body" fos="$md" fow="$semiBold" col="$textSubtle">
                  Portion size
                </SizableText>
                <InputText
                  value={draftPortionSize}
                  onChangeText={handleDraftPortionSizeChange}
                  keyboardType="decimal-pad"
                  disabled={!canEditPortionSize}
                  errorMessage={portionSizeError ?? undefined}
                />
              </YStack>

              {submitError ? (
                <SizableText ff="$body" fos="$sm" col="$danger">
                  {submitError}
                </SizableText>
              ) : null}

              {showActionSection ? (
                <XStack w="100%" ai="center" jc="space-between" gap="$space.md">
                  <SizableText ff="$body" fos="$md" fow="$semiBold" col="$text">
                    Action:
                  </SizableText>

                  <XStack gap="$space.sm">
                    {canDeleteItem ? (
                      <ActionIconButton
                        icon={Trash2}
                        backgroundColor="$softDanger"
                        iconColor="$danger"
                        onPress={handleDelete}
                      />
                    ) : null}
                    {canLogItem ? (
                      <ActionIconButton
                        icon={Check}
                        backgroundColor="$softPrimary"
                        iconColor="$primary"
                        onPress={handleLog}
                      />
                    ) : null}
                    <ActionIconButton
                      icon={ArrowRight}
                      backgroundColor="$softPrimary"
                      iconColor="$primary"
                      onPress={handleNavigateToMealDetail}
                    />
                  </XStack>
                </XStack>
              ) : null}

              {showSaveButton ? (
                <Button
                  w="100%"
                  h={53}
                  br="$pill"
                  size="large"
                  color="primary"
                  disabled={isSubmitting}
                  onPress={handleSave}
                >
                  <Button.Text>{isSubmitting ? 'Saving...' : 'Save'}</Button.Text>
                </Button>
              ) : null}
            </YStack>
          </Pressable>
        </YStack>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.48)',
  },
  cardWrap: {
    width: '100%',
    maxWidth: 360,
  },
});

function resolveActionErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return fallbackMessage;
}