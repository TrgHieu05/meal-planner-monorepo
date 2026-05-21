import { Plus } from '@tamagui/lucide-icons-2';
import { SizableText, XStack, YStack } from 'tamagui';

import { MenuMealItemRow } from './MenuMealItemRow';
import {
  getMealTimeMeta,
  type MenuMealItem,
  type MenuMealTimeGroup,
} from '@features/menu/utils/menu-meal-times';

export interface MenuMealTimeCardProps {
  mealTimeGroup: MenuMealTimeGroup;
  allowAddMeal: boolean;
  onAddMeal?: (mealTime: MenuMealTimeGroup['mealTime']) => void;
  onItemPress?: (item: MenuMealItem) => void;
}

function AddMealButton({ onPress }: { onPress?: () => void }) {
  return (
    <XStack
      w={32}
      h={32}
      ai="center"
      jc="center"
      bg="$background"
      br="$pill"
      onPress={onPress}
      pressStyle={{ opacity: 0.86, scale: 0.98 }}
    >
      <Plus color="$primary" size={18} />
    </XStack>
  );
}

export function MenuMealTimeCard({
  mealTimeGroup,
  allowAddMeal,
  onAddMeal,
  onItemPress,
}: MenuMealTimeCardProps) {
  const { label } = getMealTimeMeta(mealTimeGroup.mealTime);
  const hasItems = mealTimeGroup.items.length > 0;

  return (
    <YStack w="100%" bg="$background" br="$radius.md" borderWidth={2} borderColor="$primary" overflow="hidden">
      <XStack w="100%" ai="center" jc="space-between" gap="$space.md" px="$space.md" py="$space.md" bg="$softPrimary">
        <XStack ai="center" gap="$space.sm" f={1}>
          <SizableText ff="$heading" fos="$lg" fow="$bold" col="$primary">
            {label}
          </SizableText>
        </XStack>

        <XStack ai="center">
          {allowAddMeal ? <AddMealButton onPress={() => onAddMeal?.(mealTimeGroup.mealTime)} /> : null}
        </XStack>
      </XStack>

      {hasItems ? (
        <YStack w="100%">
          {mealTimeGroup.items.map((item, index) => (
            <YStack key={item.menuItemId}>
              <MenuMealItemRow item={item} onPress={onItemPress} />
              {index < mealTimeGroup.items.length - 1 ? <YStack mx="$space.md" h={1} bg="$color.gray6" /> : null}
            </YStack>
          ))}
        </YStack>
      ) : (
        <YStack w="100%" ai="center" jc="center" py="$space.lg" px="$space.md" gap="$space.sm">
          {allowAddMeal ? (
            <>
              <XStack
                w={40}
                h={40}
                ai="center"
                jc="center"
                br="$pill"
                borderWidth={1}
                borderStyle="dotted"
                borderColor="$color.gray6"
                onPress={() => onAddMeal?.(mealTimeGroup.mealTime)}
                pressStyle={{ opacity: 0.86, scale: 0.98 }}
              >
                <Plus color="$textSubtle" size={20} />
              </XStack>
              <SizableText ff="$body" fos="$sm" fow="$medium" col="$textSubtle">
                Add Meals
              </SizableText>
            </>
          ) : (
            <SizableText ff="$body" fos="$sm" fow="$medium" col="$textSubtle">
              No meals
            </SizableText>
          )}
        </YStack>
      )}
    </YStack>
  );
}