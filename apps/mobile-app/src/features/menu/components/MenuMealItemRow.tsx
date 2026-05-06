import { SizableText, XStack, YStack } from 'tamagui';

import {
  formatMenuNutritionValue,
  scaleMenuNutrition,
  type MenuMealItem,
} from '@features/menu/utils/menu-meal-times';

export interface MenuMealItemRowProps {
  item: MenuMealItem;
  onPress?: (item: MenuMealItem) => void;
}

export function MenuMealItemRow({ item, onPress }: MenuMealItemRowProps) {
  const nutrition = scaleMenuNutrition(item.nutritionPerServing, item.portionSize);

  return (
    <XStack
      w="100%"
      ai="center"
      gap="$space.md"
      px="$space.md"
      py="$space.md"
      onPress={() => onPress?.(item)}
      pressStyle={{ bg: '$surfacePress', opacity: 0.92 }}
    >
      <YStack w={48} h={48} bg="$surfacePress" br="$radius.sm" />

      <YStack f={1} gap={4}>
        <SizableText ff="$body" fos="$md" fow="$semiBold" col="$text">
          {item.mealName}
        </SizableText>
        <XStack gap="$space.sm" flexWrap="wrap">
          <SizableText ff="$body" fos="$sm" fow="$semiBold" color="$yellow6">
            {formatMenuNutritionValue(nutrition.calories)} kcal
          </SizableText>
          <SizableText ff="$body" fos="$sm" fow="$semiBold" color="$purple6">
            {formatMenuNutritionValue(nutrition.protein)}p
          </SizableText>
          <SizableText ff="$body" fos="$sm" fow="$semiBold" color="$jade6">
            {formatMenuNutritionValue(nutrition.fiber)} fib
          </SizableText>
          <SizableText ff="$body" fos="$sm" fow="$semiBold" color="$red6">
            {formatMenuNutritionValue(nutrition.fat)}f
          </SizableText>
        </XStack>
      </YStack>
    </XStack>
  );
}