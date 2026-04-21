import { Link } from 'expo-router';
import { XStack, YStack, Text } from 'tamagui';
import { Tag } from '@/components/Tag';
import { KeyRound, Clock } from '@tamagui/lucide-icons-2';

export default function MealScreen() {
    return (
        <YStack>
            <Text>Meal Screen</Text>
            <Link href="/">Go to Home</Link>
            <XStack gap="$md" flexWrap="wrap">
                <Tag status="brand" icon={KeyRound} >High Protein</Tag>
                <Tag status="brand">Low Carbs</Tag>
                <Tag status="danger">Low Carbs</Tag>
                <Tag status="danger" icon={Clock}>15 mins</Tag>
                <Tag status="danger" icon={Clock}>15 mins</Tag>
                <Tag status="danger" icon={Clock}>15 mins</Tag>
                <Tag status="danger" icon={Clock}>15 mins</Tag>
            </XStack>
        </YStack>
    );
}