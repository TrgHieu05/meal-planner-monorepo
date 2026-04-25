import { YStack, Text } from 'tamagui';
import { Link } from 'expo-router';

export default function MealScreen() {
	return (
		<YStack>
			<Text>Meal Screen</Text>
			<Link href="/">Go to Home</Link>
		</YStack>
	);
}
