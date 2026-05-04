import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet } from 'react-native';
import { ArrowRight, Clock3, Check, Trash2, Utensils } from '@tamagui/lucide-icons-2';
import { useRouter } from 'expo-router';
import { SizableText, XStack, YStack } from 'tamagui';

import { Button, InputText, Tag } from '@components';
import { MacroStatDetailCard } from './MacroStatDetailCard';
import {
  scaleMenuNutrition,
  type MenuMealItem,
} from '@features/menu/utils/menu-meal-times';

export interface MenuItemDetailModalProps {
  item: MenuMealItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (item: MenuMealItem) => void;
  onLog?: (item: MenuMealItem) => void;
  onSave?: (item: MenuMealItem, portionSize: number) => void;
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

function parsePortionSize(value: string, fallbackValue: number) {
  const normalizedValue = value.replace(',', '.').trim();
  const parsedValue = Number.parseFloat(normalizedValue);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallbackValue;
  }

  return parsedValue;
}

export function MenuItemDetailModal({
  item,
  open,
  onOpenChange,
  onDelete,
  onLog,
  onSave,
}: MenuItemDetailModalProps) {
  const router = useRouter();
  const [draftPortionSize, setDraftPortionSize] = useState('1');

  useEffect(() => {
    if (!open || !item) {
      return;
    }

    setDraftPortionSize(`${item.portionSize}`);
  }, [item, open]);

  const resolvedPortionSize = useMemo(() => {
    if (!item) {
      return 1;
    }

    return parsePortionSize(draftPortionSize, item.portionSize);
  }, [draftPortionSize, item]);

  const nutrition = useMemo(() => {
    if (!item) {
      return null;
    }

    return scaleMenuNutrition(item.nutritionPerServing, resolvedPortionSize);
  }, [item, resolvedPortionSize]);

  if (!item || !nutrition) {
    return null;
  }

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSave = () => {
    onSave?.(item, resolvedPortionSize);
    onOpenChange(false);
  };

  const handleNavigateToMealDetail = () => {
    onOpenChange(false);
    router.push(`/meal-search/${item.mealId}`);
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
                carbs={nutrition.carbs}
                fat={nutrition.fat}
              />

              <XStack gap="$space.sm" flexWrap="wrap">
                <Tag>
                  <Tag.Icon icon={Clock3} size={16} />
                  <Tag.Text>{item.cookTime}</Tag.Text>
                </Tag>
                <Tag>
                  <Tag.Icon icon={Utensils} size={16} />
                  <Tag.Text>{item.difficulty}</Tag.Text>
                </Tag>
                <Tag status={item.eated ? 'brand' : 'danger'}>
                  <Tag.Icon icon={Check} size={16} />
                  <Tag.Text>{item.eated ? 'Logged' : 'Not logged'}</Tag.Text>
                </Tag>
              </XStack>

              <YStack w="100%" gap="$space.xs">
                <SizableText ff="$body" fos="$md" fow="$semiBold" col="$textSubtle">
                  Portion size
                </SizableText>
                <InputText value={draftPortionSize} onChangeText={setDraftPortionSize} keyboardType="decimal-pad" />
              </YStack>

              <XStack w="100%" ai="center" jc="space-between" gap="$space.md">
                <SizableText ff="$body" fos="$md" fow="$semiBold" col="$text">
                  Action:
                </SizableText>

                <XStack gap="$space.sm">
                  <ActionIconButton
                    icon={Trash2}
                    backgroundColor="$softDanger"
                    iconColor="$danger"
                    onPress={onDelete ? () => onDelete(item) : undefined}
                  />
                  <ActionIconButton
                    icon={Check}
                    backgroundColor="$softPrimary"
                    iconColor="$primary"
                    onPress={onLog ? () => onLog(item) : undefined}
                  />
                  <ActionIconButton
                    icon={ArrowRight}
                    backgroundColor="$softPrimary"
                    iconColor="$primary"
                    onPress={handleNavigateToMealDetail}
                  />
                </XStack>
              </XStack>

              <Button w="100%" h={53} br="$pill" size="large" color="primary" onPress={handleSave}>
                <Button.Text>Save</Button.Text>
              </Button>
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