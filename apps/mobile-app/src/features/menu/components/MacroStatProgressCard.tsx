import { View, Progress, SizableText, YStack, XStack, getTokens } from 'tamagui';

const numberFormatter = new Intl.NumberFormat('en-US');

export interface MacroStatProgressCardProps {
  calories: number;
  calorieGoal?: number | null;
  protein: number;
  proteinGoal?: number | null;
  fiber: number;
  fiberGoal?: number | null;
  fat: number;
  fatGoal?: number | null;
}

interface MacroProgressItemProps {
  color: string;
  current: number;
  label: string;
  target?: number | null;
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
  const hasTarget = typeof target === 'number' && target > 0;
  const value = hasTarget ? getProgressValue(current, target) : 0;

  return (
    <YStack f={1} ai="center" gap="$space.xs">
      <SizableText ff="$body" fos="$sm" fow="$medium" color="$textSubtle">
        {label}
      </SizableText>

      {hasTarget ? (
        <Progress value={value} w="100%" h={6} bg="$background" br="$pill">
          <Progress.Indicator bg={color} br="$pill" />
        </Progress>
      ) : null}

      <SizableText ff="$body" fos="$md" fow="$semiBold" color={color}>
        {hasTarget
          ? `${formatAmount(current)} / ${formatAmount(target)} g`
          : `${formatAmount(current)} g`}
      </SizableText>
    </YStack>
  );
}

export function MacroStatProgressCard({
  calories,
  calorieGoal,
  protein,
  proteinGoal,
  fiber,
  fiberGoal,
  fat,
  fatGoal,
}: MacroStatProgressCardProps) {
  const hasCalorieGoal = typeof calorieGoal === 'number' && calorieGoal > 0;
  const caloriesLeft = hasCalorieGoal ? Math.max(calorieGoal - calories, 0) : null;
  const calorieProgress = hasCalorieGoal ? getProgressValue(calories, calorieGoal) : 0;

  return (
    <YStack w="100%" bg="$surface" br="$radius.xl" px="$space.lg" py="$space.md" gap="$space.md">
      <XStack ai="flex-start" jc="space-between" gap="$space.md">
        <SizableText ff="$heading" fos="$h3" fow="$bold" color="$text">
          {formatAmount(calories)} kcal
        </SizableText>

        <SizableText ff="$body" fos="$sm" fow="$medium" color="$textSubtle" mt="$space.xs">
          {hasCalorieGoal && caloriesLeft != null
            ? `${formatAmount(caloriesLeft)} left`
            : 'No calorie target'}
        </SizableText>
      </XStack>

      {hasCalorieGoal ? (
        <Progress value={calorieProgress} w="100%" h={10} bg="$background" br="$pill">
          <Progress.Indicator bg="$yellow6" br="$pill" />
        </Progress>
      ) : null}

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
          current={fiber}
          label="Fiber"
          target={fiberGoal}
        />
        <MacroProgressItem color="$red6" current={fat} label="Fat" target={fatGoal} />
      </XStack>
    </YStack>
  );
}