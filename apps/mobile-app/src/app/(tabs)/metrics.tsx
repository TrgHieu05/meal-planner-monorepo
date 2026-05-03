import { Link } from 'expo-router';
import { XStack, YStack, Text } from 'tamagui';
import { Tag } from '@/components/Tag';
import { KeyRound, Clock } from '@tamagui/lucide-icons-2';

export default function MealScreen() {
    return (
        <YStack>
            <Text>Meal Screen</Text>
            <Link href="/" asChild><Text>Go to Home</Text></Link>
        </YStack>
    );
}