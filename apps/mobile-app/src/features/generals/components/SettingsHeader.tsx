import { useRouter } from 'expo-router';
import { ChevronLeft } from '@tamagui/lucide-icons-2';
import { SizableText, XStack, useTheme } from 'tamagui';

export function SettingsHeader() {
    const router = useRouter();
    const theme = useTheme();

    return (
        <XStack h={40} ai="center" jc="center" pos="relative">
            <XStack pos="absolute" l={0} p="$xs" onPress={() => router.back()} pressStyle={{ opacity: 0.7 }}>
                <ChevronLeft color={theme.text.val} size={24} />
            </XStack>

            <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                Settings
            </SizableText>
        </XStack>
    );
}