import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';

import { AppProviders } from '@/providers/AppProviders';
import { useSession } from '@/providers/AuthProvider';

const AUTH_ROUTE_NAMES = new Set([
	'login',
	'signup',
	'forgot-password',
	'verify-otp',
	'reset-password',
]);

export default function RootLayout() {
	return (
		<AppProviders>
			<RootNavigator />
		</AppProviders>
	);
}

function RootNavigator() {
	const {
		isAuthenticated,
		isLoading,
		isOnboardingCompleted,
	} = useSession();
	const router = useRouter();
	const segments = useSegments();
	const topLevelRoute = typeof segments[0] === 'string' ? segments[0] : null;
	const isAuthRoute = topLevelRoute != null && AUTH_ROUTE_NAMES.has(topLevelRoute);
	const isOnboardingRoute = topLevelRoute === 'onboarding';
	const isProtectedAppRoute =
		topLevelRoute === '(tabs)' ||
		topLevelRoute === 'generals' ||
		topLevelRoute === 'profile' ||
		topLevelRoute === 'meal-search' ||
		topLevelRoute === 'template';

	useEffect(() => {
		if (isLoading) {
			return;
		}

		if (!isAuthenticated) {
			if (!isAuthRoute) {
				router.replace('/login');
			}
			return;
		}

		if (!isOnboardingCompleted) {
			if (!isOnboardingRoute) {
				router.replace('/onboarding/step-1');
			}
			return;
		}

		if (!isProtectedAppRoute) {
			router.replace('/');
		}
	}, [
		isAuthRoute,
		isAuthenticated,
		isLoading,
		isOnboardingCompleted,
		isOnboardingRoute,
		isProtectedAppRoute,
		router,
	]);

	if (isLoading) {
		return null;
	}

	return (
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Protected guard={isAuthenticated && isOnboardingCompleted}>
					<Stack.Screen name="(tabs)" />
					<Stack.Screen name="generals/settings" />
					<Stack.Screen name="profile/edit-user-info" />
					<Stack.Screen name="profile/edit-preference" />
					<Stack.Screen name="profile/edit-metric" />
					<Stack.Screen name="profile/edit-allergy" />
					<Stack.Screen name="profile/edit-favorite-ingredient" />
					<Stack.Screen name="meal-search/index" />
					<Stack.Screen name="meal-search/[mealId]" />
					<Stack.Screen name="template" />
				</Stack.Protected>
				<Stack.Protected guard={isAuthenticated && !isOnboardingCompleted}>
					<Stack.Screen name="onboarding" />
				</Stack.Protected>
				<Stack.Protected guard={!isAuthenticated}>
					<Stack.Screen name="login" />
					<Stack.Screen name="signup" />
					<Stack.Screen name="forgot-password" />
					<Stack.Screen name="verify-otp" />
					<Stack.Screen name="reset-password" />
				</Stack.Protected>
			</Stack>
	);
}
