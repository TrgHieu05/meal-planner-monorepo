import { Text, XStack, YStack } from 'tamagui';
import { IconProps } from '@tamagui/helpers-icon'
interface InfoItemProps {
  label: string;
  value: string;
    Icon: React.FC<IconProps>;
  isLast?: boolean; // Thêm prop isLast để xác định item cuối cùng trong danh sách, dùng để điều chỉnh borderBottomColor
}

export function InfoItem({ label, value, Icon, isLast }: InfoItemProps) {
    return (
        <XStack 
            alignItems="center" gap="$md" 
            bg="$surface" px="$space.md" py="$space.md"
            borderBottomWidth={ isLast ? 0 : 1} // Nếu là item cuối cùng thì không có borderBottom
            borderBottomColor="$color.gray6"
            pressStyle={{ bg: '$surfaceHover' }}
        >

            <XStack p="$space.sm" bg="$background" br="$radius.md">   
                <Icon size={24} col="$text" />
            </XStack>

            <YStack gap="$space.xs">
                <Text ff="$body" fos="$sm" fow="$medium" col="$textSubtle">{`${label}`}</Text>
                <Text ff="$body" fos="$md" fow="$medium" col="$text">{`${value}`}</Text>
            </YStack>

        </XStack>
    );
}