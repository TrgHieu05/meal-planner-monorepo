import { SizableText, XStack, YStack } from 'tamagui';
import { Link } from 'expo-router';

export interface MealCardProps {
    id: string;
  mealName: string;
  cookTime: string;
  difficulty: string;
  totalCalories: string;
  totalProtein: string;
  totalCarbs: string;
  totalFat: string;
  onPress?: () => void;
}

export function MealCard({
    id,
  mealName,
  cookTime,
  difficulty,
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFat,
  onPress,
}: MealCardProps) {
  return (
    <Link href={`/meal-search/${id}`} asChild> 
      <XStack id={id} onPress={onPress} w="100%" p="$space.md" pressStyle={{ bg: "$surfacePress", scale: 0.99 }} bg="$surface" borderRadius="$md" gap ="$space.md">
          <YStack h={64} w={64} bg="$background" br="$radius.sm"/>
          <YStack h={64} w="100%" ai="flex-start" jc="space-between">
              <SizableText w="100%" col="$text" ff="$body" fos="$lg" fow="$semiBold" >{mealName}</SizableText>
              <SizableText ff="$body" fos="$sm" fow="$medium" color="$textSubtle">{cookTime} | {difficulty}</SizableText>
              <XStack gap="$space.sm" w="100%">
                  <SizableText ff="$body" fos="$sm" fow="$semiBold" color="$yellow6">{totalCalories} kcal</SizableText>
                  <SizableText ff="$body" fos="$sm" fow="$semiBold" color="$purple6">{totalProtein}p</SizableText>
                  <SizableText ff="$body" fos="$sm" fow="$semiBold" color="$green6">{totalCarbs}c</SizableText>
                  <SizableText ff="$body" fos="$sm" fow="$semiBold" color="$red6">{totalFat}f</SizableText>
              </XStack>
          </YStack>
      </XStack>
    </Link>
  );
}