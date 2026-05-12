import { Link } from 'expo-router';
import { MoonStar, Sun } from '@tamagui/lucide-icons-2';
import { ScrollView, SizableText, YStack, XStack } from 'tamagui';
import { Button, InputSearch } from '@components'
import { useAppTheme } from '@/providers/AppProviders';
import MenuScreen from '@features/menu/screens/MenuScreen';

export default function HomeScreen() {
  const { themeName, toggleTheme } = useAppTheme();
  const isDark = themeName === 'dark';

  return (
    <ScrollView bg="$background" f={1}>
      <YStack w="100%" p="$space.md" pb="$space.xl" gap="$space.lg">
        <XStack w="100%" ai="center" jc="space-between">
          <YStack gap="$space.xs">
            <SizableText color="$text" ff="$heading" fos="$h4" fow="$bold">
              Good Morning, User!
            </SizableText>
            <SizableText color="$textSubtle" ff="$body" fos="$md" fow="$medium">
              Start planning your meals for the day.
            </SizableText>
          </YStack>
          <Button w={48} color="secondary" h={48} onPress={toggleTheme}>
            <Button.Icon icon={isDark ? MoonStar : Sun} size={24} />
          </Button>
        </XStack>

        <Link href="/meal-search" asChild>
          <InputSearch placeholder="Search for meals..." />
        </Link>

        <MenuScreen variant="home" />
      </YStack>
    </ScrollView>
  );
}
