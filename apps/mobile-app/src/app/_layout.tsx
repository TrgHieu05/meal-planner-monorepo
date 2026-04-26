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
					<Stack.Screen name="onboarding" />
				</Stack.Protected>
				<Stack.Protected guard={!isLoggedIn}>
					<Stack.Screen name="login" />
					<Stack.Screen name="signup" />
					<Stack.Screen name="forgot-password" />
					<Stack.Screen name="verify-otp" />
					<Stack.Screen name="reset-password" />
				</Stack.Protected>
			</Stack>
		</AppProviders>
	);
}
