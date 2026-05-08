import { SizableText, XStack } from 'tamagui';

export interface DayTabProps {
    isSelected: boolean;
    label: string;
    onPress?: () => void;
}

export function DayTab({ isSelected, label, onPress }: DayTabProps) {
    return (
        <XStack
            ai="center"
            jc="center"
            px="$space.md"
            py="$space.sm"
            br="$radius.pill"
            bg={isSelected ? '$primary' : '$surface'}
            onPress={onPress}
            pressStyle={{ opacity: 0.86, scale: 0.98 }}
        >
            <SizableText ff="$body" fos="$md" fow="$semiBold" col={isSelected ? '$textInverse' : '$text'}>
                {label}
            </SizableText>
        </XStack>
    );
}