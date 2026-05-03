import { Link } from 'expo-router';
import { MoonStar, Sun } from '@tamagui/lucide-icons-2';
import { Paragraph, SizableText, YStack, XStack } from 'tamagui';
import { Button, InputSearch } from '@components'
import { useAppTheme } from '@/providers/AppProviders';
import { useSession } from '@/providers/AuthProvider';

export default function HomeScreen() {
  const { themeName, toggleTheme } = useAppTheme();
  const isDark = themeName === 'dark';
  const { signOut } = useSession();

  return (
    <YStack h="100%" w="100%" bg="$background" p="$space.md" gap="$space.xl">

      <XStack w="100%" ai="center" jc="space-between">
        <YStack>
          <SizableText color="$text" ff="$heading" fos="$h4" fow="$bold">
            Good Morning, User!
          </SizableText>
          <SizableText color="$textSubtle" ff="$body" fos="$md" fow="$medium">
            Start planning your meals for the day.
          </SizableText>
        </YStack>
        <Button w={48} h={48} size="medium" color="secondary" onPress={toggleTheme} pressStyle={{ bg:"$surfacePress"}} >
          <Button.Icon icon={isDark ? MoonStar : Sun} size={24}/>
        </Button>
      </XStack>
       
      
      <Link href="/meal-search" asChild>
        <InputSearch placeholder="Search for meals..." />
      </Link>
      
      <YStack ai="center" jc="center">
        <SizableText color="$text" ff="$heading" fos="$xl" fow="$bold">
          Meal Planner Mobile
        </SizableText>
        <Paragraph mt="$sm" textAlign="center" color="$textSubtle" ff="$body">
          <SizableText>Base app is cleaned and ready for Tamagui setup.</SizableText>
        </Paragraph>

        <Button w="100%" onPress={() => void signOut()} color="danger" size="large">
          <Button.Text>
            Logout
          </Button.Text>
        </Button> 
      </YStack>
    </YStack>
  );
}
