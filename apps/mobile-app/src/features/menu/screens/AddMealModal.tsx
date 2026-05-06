import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import type { MealTime } from '@meal/shared';
import { SizableText, XStack, YStack } from 'tamagui';

import { Button, Chip, InputDate, InputText } from '@components';
import { useSession } from '@/providers/AuthProvider';
import { createMenuItem } from '@features/menu/api/menu.api';
import {
  formatMenuApiDate,
  parseMenuFlowDateParam,
  toMealTimeFromMenuFlowParam,
} from '@features/menu/utils/menu-flow';
import { createTodayCalendarDate } from '@features/menu/utils/week-date';

export interface AddMealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealId: number;
  hideDateAndMealTime?: boolean;
  lockedDate?: string;
  lockedMealTime?: string;
  onSuccess?: () => void;
}

const MEAL_TIME_OPTIONS: Array<{ value: MealTime; label: string }> = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
];

export function AddMealModal({
  open,
  onOpenChange,
  mealId,
  hideDateAndMealTime = false,
  lockedDate,
  lockedMealTime,
  onSuccess,
}: AddMealModalProps) {
  const { session } = useSession();
  const [selectedDate, setSelectedDate] = useState<Date>(() => createTodayCalendarDate());
  const [portionSize, setPortionSize] = useState('1');
  const [selectedMealTime, setSelectedMealTime] = useState<MealTime>('BREAKFAST');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const lockedDateValue = useMemo(() => parseMenuFlowDateParam(lockedDate), [lockedDate]);
  const lockedMealTimeValue = useMemo(
    () => toMealTimeFromMenuFlowParam(lockedMealTime),
    [lockedMealTime],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedDate(lockedDateValue ?? createTodayCalendarDate());
    setPortionSize('1');
    setSelectedMealTime(lockedMealTimeValue ?? 'BREAKFAST');
    setSubmitError(null);
  }, [lockedDateValue, lockedMealTimeValue, open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSelectMealTime = (mealTime: MealTime) => {
    setSelectedMealTime(mealTime);
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    if (!session?.accessToken) {
      setSubmitError('Missing access token. Please sign in again.');
      return;
    }

    const resolvedDate = hideDateAndMealTime ? lockedDateValue : selectedDate;
    const resolvedMealTime = hideDateAndMealTime ? lockedMealTimeValue : selectedMealTime;
    const resolvedPortionSize = parsePortionSize(portionSize);

    if (!resolvedDate || !resolvedMealTime) {
      setSubmitError('Missing menu context. Please select a valid date and meal time.');
      return;
    }

    if (resolvedPortionSize == null) {
      setSubmitError('Portion size must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createMenuItem({
        accessToken: session.accessToken,
        payload: {
          date: formatMenuApiDate(resolvedDate),
          mealId,
          mealTime: resolvedMealTime,
          portionSize: resolvedPortionSize,
        },
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      setSubmitError(resolveMenuMutationErrorMessage(error, 'Unable to add this meal to your menu.'));
    } finally {
      setIsSubmitting(false);
    }
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
            <YStack w="100%" maw={360} bg="$background" br="$radius.xl" px="$space.lg" py="$space.lg" gap="$space.lg">
              <SizableText ff="$heading" fos="$h3" fow="$bold" col="$text" ta="center">
                Add Options
              </SizableText>

              {!hideDateAndMealTime ? (
                <YStack w="100%" gap="$space.xs">
                  <SizableText ff="$body" fos="$md" fow="$semiBold" col="$textSubtle">
                    Date to Add
                  </SizableText>
                  <InputDate value={selectedDate} onValueChange={setSelectedDate} />
                </YStack>
              ) : null}

              <YStack w="100%" gap="$space.xs">
                <SizableText ff="$body" fos="$md" fow="$semiBold" col="$textSubtle">
                  Portion size
                </SizableText>
                <InputText value={portionSize} onChangeText={setPortionSize} keyboardType="decimal-pad" />
              </YStack>

              {!hideDateAndMealTime ? (
                <YStack w="100%" gap="$space.sm">
                  <SizableText ff="$body" fos="$md" fow="$semiBold" col="$textSubtle">
                    Meal time
                  </SizableText>
                  <XStack gap="$space.sm" flexWrap="wrap">
                    {MEAL_TIME_OPTIONS.map((option) => {
                      const selected = selectedMealTime === option.value;

                      return (
                        <Chip
                          key={option.value}
                          tone={selected ? 'brand' : 'neutral'}
                          onPress={() => handleSelectMealTime(option.value)}
                        >
                          <Chip.Text>{option.label}</Chip.Text>
                        </Chip>
                      );
                    })}
                  </XStack>
                </YStack>
              ) : null}

              {submitError ? (
                <SizableText ff="$body" fos="$sm" col="$danger">
                  {submitError}
                </SizableText>
              ) : null}

              <XStack w="100%" gap="$space.md">
                <Button f={1} h={48} br="$pill" color="secondary" onPress={handleClose}>
                  <Button.Text>Cancel</Button.Text>
                </Button>
                <Button f={1} h={48} br="$pill" color="primary" onPress={() => void handleSubmit()}>
                  <Button.Text>{isSubmitting ? 'Adding...' : 'Add'}</Button.Text>
                </Button>
              </XStack>
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

function parsePortionSize(value: string) {
  const normalizedValue = value.replace(',', '.').trim();
  const parsedValue = Number.parseFloat(normalizedValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return parsedValue;
}

function resolveMenuMutationErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return fallbackMessage;
}