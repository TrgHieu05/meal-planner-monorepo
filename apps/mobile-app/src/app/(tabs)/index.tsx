import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { Button, Paragraph, Text, YStack, XStack, useTheme } from 'tamagui';

import { useAppTheme } from '@/providers/AppProviders';

export default function HomeScreen() {
  const theme = useTheme();
  const { themeName, toggleTheme } = useAppTheme();
  const isDark = themeName === 'dark';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background.val }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content' } backgroundColor={theme.background.val} />

      <YStack h={200} bg="$primary" bblr="$lg" bbrr="$lg" ai="center" jc="center">
        <Text col="$textInverse" ff="$heading" fos="$h1" fow="$bold">
          Kitchen Mind
        </Text>
      </YStack>

      <YStack f={1} ai="center" jc="center" px="$lg">
        <Text color="$text" ff="$heading" fos="$xl" fow="$bold">
          Meal Planner Mobile
        </Text>
        <Paragraph mt="$sm" textAlign="center" color="$textSubtle" ff="$body">
          <Text>Base app is cleaned and ready for Tamagui setup.</Text>
        </Paragraph>

        <Button mt="$lg" w="100%" h="hug" onPress={toggleTheme} bg="$primary" py="$sm">
          <Text col="$textInverse" ff="$body" fos="$lg" fow="$medium">
            Switch to {isDark ? 'Light' : 'Dark'} mode
          </Text>
        </Button>
        <Text mt="$lg" ff="$body" fos="$xs" fow="$light" color="$text">
          This is a simple text element.
        </Text>

        <XStack mt="$lg" gap="$md">
          <Link href="/meals">
            <Text col="$text" ff="$body" fos="$lg" fow="$medium">
              Go to Meals
            </Text>
          </Link>

          <Link href="/metrics">
            <Text col="$text" ff="$body" fos="$lg" fow="$medium">
              Go to Metrics
            </Text>
          </Link>"

          <Link href="/(auth)/">
            <Text col="$text" ff="$body" fos="$lg" fow="$medium">
              Go to Auth
            </Text>
          </Link>

        </XStack>
      </YStack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
