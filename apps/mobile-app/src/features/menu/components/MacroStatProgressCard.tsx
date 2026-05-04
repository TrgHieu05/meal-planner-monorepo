import { View, Progress, SizableText, YStack, XStack } from 'tamagui';

const numberFormatter = new Intl.NumberFormat('en-US');

export interface MacroStatProgressCardProps {
  calories: number;
  calorieGoal: number;
  protein: number;
  proteinGoal: number;
  carbs: number;
  carbsGoal: number;
  fat: number;
  fatGoal: number;
}

interface MacroProgressItemProps {
  color: string;
  current: number;
  label: string;
  target: number;
}

function formatAmount(value: number) {
  return numberFormatter.format(value);
}

function getProgressValue(current: number, target: number) {
  if (target <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (current / target) * 100));
}

function MacroProgressItem({ color, current, label, target }: MacroProgressItemProps) {
  const value = getProgressValue(current, target);

  return (
    <YStack f={1} ai="center" gap="$space.xs">
      <SizableText ff="$body" fos="$sm" fow="$medium" color="$text">
        {label}
      </SizableText>

      <Progress value={value} w="100%" h={6} bg="$background" br="$pill">
        <Progress.Indicator bg={color} br="$pill" />
      </Progress>

      <SizableText ff="$body" fos={12} fow="$medium" color="$textSubtle">
        {formatAmount(current)} / {formatAmount(target)} g
      </SizableText>
    </YStack>
  );
}

export function MacroStatProgressCard({
  calories,
  calorieGoal,
  protein,
  proteinGoal,
  carbs,
  carbsGoal,
  fat,
  fatGoal,
}: MacroStatProgressCardProps) {
  const caloriesLeft = Math.max(calorieGoal - calories, 0);
  const calorieProgress = getProgressValue(calories, calorieGoal);

  return (
    <YStack w="100%" bg="$surface" br="$radius.xl" px="$space.lg" py="$space.md" gap="$space.md">
      <XStack ai="flex-start" jc="space-between" gap="$space.md">
        <SizableText ff="$heading" fos="$h3" fow="$bold" color="$text">
          {formatAmount(calories)} kcal
        </SizableText>

        <SizableText ff="$body" fos="$sm" fow="$medium" color="$textSubtle" mt="$space.xs">
          {formatAmount(caloriesLeft)} left
        </SizableText>
      </XStack>

      <Progress value={calorieProgress} w="100%" h={10} bg="$background" br="$pill">
        <Progress.Indicator bg="$yellow6" br="$pill" />
      </Progress>

      <View w="100%" h={2} bg="$surfacePress" br="$pill"></View>

      <XStack w="100%" gap="$space.md">
        <MacroProgressItem
          color="$purple6"
          current={protein}
          label="Protein"
          target={proteinGoal}
        />
        <MacroProgressItem
          color="$jade6"
          current={carbs}
          label="Carbs"
          target={carbsGoal}
        />
        <MacroProgressItem color="$red6" current={fat} label="Fat" target={fatGoal} />
      </XStack>
    </YStack>
  );
}