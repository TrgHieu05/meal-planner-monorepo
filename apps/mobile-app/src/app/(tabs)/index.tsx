import { Link } from 'expo-router';
import { Button, Paragraph, SizableText, YStack, XStack, useTheme } from 'tamagui';

import { useAppTheme } from '@/providers/AppProviders';
import { useAuthStore } from '@store/authStore';

export default function HomeScreen() {
  const { themeName, toggleTheme } = useAppTheme();
  const isDark = themeName === 'dark';
  const { logout } = useAuthStore();

  return (
    <YStack h="100%" w="100%" bg="$background">
      <YStack h={200} bg="$primary" bblr="$lg" bbrr="$lg" ai="center" jc="center">
        <SizableText col="$textInverse" ff="$heading" fos="$h1" fow="$bold">
          Kitchen Mind
        </SizableText>
      </YStack>

      <YStack f={1} ai="center" jc="center" px="$lg">
        <SizableText color="$text" ff="$heading" fos="$xl" fow="$bold">
          Meal Planner Mobile
        </SizableText>
        <Paragraph mt="$sm" textAlign="center" color="$textSubtle" ff="$body">
          <SizableText>Base app is cleaned and ready for Tamagui setup.</SizableText>
        </Paragraph>

        <Button mt="$lg" w="100%" h="hug" onPress={toggleTheme} bg="$primary" py="$sm">
          <SizableText col="$textInverse" ff="$body" fos="$lg" fow="$medium">
            Switch to {isDark ? 'Light' : 'Dark'} mode
          </SizableText>
        </Button>
        <SizableText mt="$lg" ff="$body" fos="$xs" fow="$light" color="$text">
          This is a simple text element.
        </SizableText>

        <XStack mt="$lg" gap="$md">
          <Link href="/meals">
            <SizableText col="$text" ff="$body" fos="$lg" fow="$medium">
              Go to Meals
            </SizableText>
          </Link>

          <Link href="/metrics">
            <SizableText col="$text" ff="$body" fos="$lg" fow="$medium">
              Go to Metrics
            </SizableText>
          </Link>"

          <Link href="/login">
            <SizableText col="$text" ff="$body" fos="$lg" fow="$medium">
              Go to Auth
            </SizableText>
          </Link>

        </XStack>

        <Button mt="$lg" w="100%" h="hug" onPress={logout} bg="$danger" py="$sm">
          <SizableText col="$textInverse" ff="$body" fos="$lg" fow="$medium">
            Logout
          </SizableText>
        </Button> 
      </YStack>
    </YStack>
  );
}
