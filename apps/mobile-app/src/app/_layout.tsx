import { Stack } from 'expo-router';

import { AppProviders } from '@/providers/AppProviders';
import { useAuthStore } from '@store/authStore';

export default function RootLayout() {
	const { isLoggedIn } = useAuthStore();
	return (
		<AppProviders>
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Protected guard={isLoggedIn}>
					<Stack.Screen name="(tabs)" />
				</Stack.Protected>
				<Stack.Protected guard={!isLoggedIn}>
					<Stack.Screen name="login" />
					<Stack.Screen name="signup" />
				</Stack.Protected>
			</Stack>
		</AppProviders>
	);
}
