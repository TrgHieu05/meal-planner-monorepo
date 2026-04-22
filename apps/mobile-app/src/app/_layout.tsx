import { Stack } from 'expo-router';
import { Spinner, Text, YStack } from 'tamagui';

import { useSession } from '@features/auth/hooks/useSession';
import { AppProviders } from '@/providers/AppProviders';

function RootNavigator() {
	const { isLoading, session } = useSession();

	if (isLoading) {
		return (
			<YStack f={1} ai="center" jc="center" gap="$sm">
				<Spinner size="large" color="$primary" />
				<Text ff="$body" fos="$md" fow="$medium">
					Restoring session...
				</Text>
			</YStack>
		);
	}

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Protected guard={!!session}>
				<Stack.Screen name="(tabs)" />
			</Stack.Protected>
			<Stack.Protected guard={!session}>
				<Stack.Screen name="(auth)" />
				<Stack.Screen name="login" />
			</Stack.Protected>
		</Stack>
	);
	}

export default function RootLayout() {
	return (
		<AppProviders>
			<RootNavigator />
		</AppProviders>
	);
}
