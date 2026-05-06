import { memo } from 'react';
import { SizableText, XStack, YStack } from 'tamagui';
import { Link, type Href } from 'expo-router';

import type { MealDifficultyLabel } from '../types';

export interface MealCardProps {
  id: number | string;
  mealName: string;
  cookTime: string;
  difficulty: MealDifficultyLabel;
  totalCalories: string;
  totalProtein: string;
  totalFiber: string;
  totalFat: string;
  href?: Href;
  onPress?: () => void;
}

function MealCardComponent({
    id,
  mealName,
  cookTime,
  difficulty,
  totalCalories,
  totalProtein,
  totalFiber,
  totalFat,
  href,
  onPress,
}: MealCardProps) {
  const content = (
    <XStack onPress={onPress} w="100%" p="$space.md" pressStyle={{ bg: "$surfacePress", scale: 0.99 }} bg="$surface" borderRadius="$md" gap="$space.md">
      <YStack h={64} w={64} bg="$background" br="$radius.sm"/>
      <YStack h={64} f={1}  ai="flex-start" jc="space-between">
        <SizableText w="100%" col="$text" ff="$body" fos="$lg" fow="$semiBold">{mealName}</SizableText>
        <XStack gap="$space.sm" w="100%">
          <SizableText ff="$body" fos="$sm" fow="$semiBold" color="$yellow6">{totalCalories} kcal</SizableText>
          <SizableText ff="$body" fos="$sm" fow="$semiBold" color="$purple6">{totalProtein}p</SizableText>
          <SizableText ff="$body" fos="$sm" fow="$semiBold" color="$jade6">{totalFiber} fib</SizableText>
          <SizableText ff="$body" fos="$sm" fow="$semiBold" color="$red6">{totalFat}f</SizableText>
        </XStack>
        <SizableText w="100%" ff="$body" fos="$sm" fow="$medium" color="$textSubtle">{cookTime}  |  {difficulty}</SizableText>
      </YStack>
    </XStack>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} asChild>
      {content}
    </Link>
  );
}

export const MealCard = memo(MealCardComponent)