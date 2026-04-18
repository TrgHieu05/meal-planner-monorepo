import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Paragraph, Text, YStack, useTheme } from 'tamagui';

import { useAppTheme } from '@/providers/AppProviders';

export function HomeScreen() {
  const theme = useTheme();
  const { themeName, toggleTheme } = useAppTheme();
  const isDark = themeName === 'dark';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background.val }]}>
      <StatusBar barStyle={isDark ? 'dark-content' : 'light-content' } backgroundColor={theme.primary.val} />

      <YStack h={200} bg="$primary" bblr="$lg" bbrr="$lg" ai="center" jc="center">
        <Text col="$white" ff="$heading" fos="$h1" fow="$bold">
          Kitchen Mind
        </Text>
      </YStack>

      <YStack f={1} ai="center" jc="center" px="$lg">
        <Text color="$color" ff="$heading" fos="$xl" fow="$bold">
          Meal Planner Mobile
        </Text>
        <Paragraph mt="$sm" textAlign="center" color="$color" opacity={0.7} ff="$body">
          Base app is cleaned and ready for Tamagui setup.
        </Paragraph>

        <Button mt="$lg" w="100%" h="hug" onPress={toggleTheme} bg="$primary" py="$sm">
          <Text col="$white" ff="$body" fos="$lg" fow="$medium">
            Switch to {isDark ? 'Light' : 'Dark'} mode
          </Text>
        </Button>
        <Text mt="$lg" ff="$body" fos="$xs" fow="$light" color="$color">
          This is a simple text element.
        </Text>
      </YStack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
});
