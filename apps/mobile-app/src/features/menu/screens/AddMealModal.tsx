import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import type { MealTime } from '@meal/shared/types/menu-item';
import { SizableText, XStack, YStack } from 'tamagui';

import { Button, Chip, InputDate, InputText } from '@components';
import { createTodayCalendarDate } from '@features/menu/utils/week-date';

export interface AddMealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hideDateAndMealTime?: boolean;
}

const MEAL_TIME_OPTIONS: Array<{ value: MealTime; label: string }> = [
  { value: 'BREAKFAST', label: 'Breakfast' },
  { value: 'LUNCH', label: 'Lunch' },
  { value: 'DINNER', label: 'Dinner' },
];

export function AddMealModal({ open, onOpenChange, hideDateAndMealTime = false }: AddMealModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => createTodayCalendarDate());
  const [portionSize, setPortionSize] = useState('1');
  const [selectedMealTimes, setSelectedMealTimes] = useState<MealTime[]>(['BREAKFAST']);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSelectedDate(createTodayCalendarDate());
    setPortionSize('1');
    setSelectedMealTimes(['BREAKFAST']);
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleToggleMealTime = (mealTime: MealTime) => {
    setSelectedMealTimes((currentValue) => {
      if (currentValue.includes(mealTime)) {
        return currentValue.filter((value) => value !== mealTime);
      }

      return [...currentValue, mealTime];
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
                      const selected = selectedMealTimes.includes(option.value);

                      return (
                        <Chip
                          key={option.value}
                          tone={selected ? 'brand' : 'neutral'}
                          onPress={() => handleToggleMealTime(option.value)}
                        >
                          <Chip.Text>{option.label}</Chip.Text>
                        </Chip>
                      );
                    })}
                  </XStack>
                </YStack>
              ) : null}

              <XStack w="100%" gap="$space.md">
                <Button f={1} h={48} br="$pill" color="secondary" onPress={handleClose}>
                  <Button.Text>Cancel</Button.Text>
                </Button>
                <Button f={1} h={48} br="$pill" color="primary" onPress={handleClose}>
                  <Button.Text>Add</Button.Text>
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