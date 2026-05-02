import { YStack, Text } from 'tamagui';
import { Link } from 'expo-router';

export default function MealScreen() {
	return (
		<YStack>
			<Text>Meal Screen</Text>
			<Link href="/" asChild><Text>Go to Home</Text></Link>
		</YStack>
	);
}
