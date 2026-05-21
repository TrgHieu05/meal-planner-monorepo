import { SizableText, XStack, YStack } from 'tamagui';

export interface MacroStatDetailCardProps {
  calories: number | string;
  fiber: number | string;
  fat: number | string;
  protein: number | string;
}

interface MacroStatItemProps {
  color: string;
  label: string;
  value: number | string;
}

function MacroStatItem({ color, label, value }: MacroStatItemProps) {
  return (
    <XStack ai="center" gap="$space.xs">
      <YStack w={10} h={10} br="$pill" bg={color} />
      <SizableText ff="$body" fos="$sm" fow="$medium" color="$textSubtle">
        {label}
      </SizableText>
      <SizableText ff="$body" fos="$sm" fow="$semiBold" color="$text">
        {value} g
      </SizableText>
    </XStack>
  );
}

export function MacroStatDetailCard({
  calories,
  fiber,
  fat,
  protein,
}: MacroStatDetailCardProps) {
  return (
    <YStack w="100%" bg="$surface" br="$radius.xl" px="$space.lg" py="$space.md" gap="$space.md">
      <SizableText ff="$heading" fos="$h3" fow="$bold" color="$text">
        {calories} kcal
      </SizableText>

      <XStack gap="$space.md" ai="center" jc="space-between" flexWrap="wrap">
        <MacroStatItem color="$purple6" label="Protein" value={protein} />
        <MacroStatItem color="$jade6" label="Fiber" value={fiber} />
        <MacroStatItem color="$red6" label="Fat" value={fat} />
      </XStack>
    </YStack>
  );
}