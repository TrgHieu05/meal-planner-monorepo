import { ChevronRight } from '@tamagui/lucide-icons-2';
import { SizableText, XStack } from 'tamagui';

export interface SettingItemProps {
    label: string;
    Icon: typeof ChevronRight;
    onPress?: () => void;
    isLast?: boolean;
}

export function SettingItem({ label, Icon, onPress, isLast = false }: SettingItemProps) {
    return (
        <XStack
            ai="center"
            jc="space-between"
            px="$space.md"
            py="$space.md"
            bg="$surface"
            borderBottomWidth={isLast ? 0 : 1}
            borderColor="$color.gray5"
            onPress={onPress}
            pressStyle={{ background: '$surfaceHover' }}
        >
            <XStack ai="center" gap="$space.md">
                <XStack ai="center" jc="center" w={24} h={24}>
                    <Icon color="$text" size={18} />
                </XStack>

                <SizableText ff="$body" fos="$md" fow="$semiBold" col="$text">
                    {label}
                </SizableText>
            </XStack>

            <ChevronRight color="$textSubtle" size={18} />
        </XStack>
    );
}