import { Text, XStack, YStack } from 'tamagui';
import type { LucideIcon } from 'lucide-react-native';
interface InfoItemProps {
  label: string;
  value: string;
    Icon: LucideIcon;
  isLast?: boolean; // Thêm prop isLast để xác định item cuối cùng trong danh sách, dùng để điều chỉnh borderBottomColor
}

export function InfoItem({ label, value, Icon, isLast }: InfoItemProps) {
    return (
        <XStack 
            alignItems="center" gap="$md" 
            bg="$surface" px="$space.md" py="$space.md"
            borderBottomWidth={isLast ? 0 : 1} 
            borderBottomColor="#cecece"
        >

            <XStack p="$space.sm" bg="#ffffff" br="$radius.md">   
                <Icon size={24} color="#1a1a1a" />
            </XStack>

            <YStack gap="$space.xs">
                <Text ff="$body" fos="$sm" fow="$medium" col="$textSubtle">{`${label}`}</Text>
                <Text ff="$body" fos="$md" fow="$medium" col="$text">{`${value}`}</Text>
            </YStack>

        </XStack>
    );
}