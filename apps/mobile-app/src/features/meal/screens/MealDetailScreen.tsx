import { Button, Tag } from '@components';
import { useAppTheme } from '@/providers/AppProviders';
import { getMockMealById } from '@features/meal/mockMeals';
import { Clock3, Utensils, ChevronLeft } from '@tamagui/lucide-icons-2';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SizableText, ScrollView, XStack, YStack, useTheme } from 'tamagui';

function MacroStat({
	value,
	label,
	color,
}: {
	value: string;
	label: string;
	color: string;
}) {
	return (
		<YStack f={1} ai="center" gap="$space.xs">
			<SizableText ff="$body" fos="$lg" fow="$bold" col={color}>
				{value}
			</SizableText>
			<SizableText ff="$body" fos="$sm" col="$textSubtle">
				{label}
			</SizableText>
		</YStack>
	);
}

export default function MealDetailScreen() {
	const theme = useTheme();
	const { themeName } = useAppTheme();
	const router = useRouter();
	const params = useLocalSearchParams<{ mealId?: string }>();
	const mealId = params.mealId;
	const meal = getMockMealById(mealId);

	if (!meal) {
		return (
			<SafeAreaView style={{ flex: 1, backgroundColor: theme.background.val }}>
				<StatusBar barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'} />
				<YStack f={1} px="$space.md" py="$space.lg" gap="$space.lg" bg="$background">
					<XStack ai="center" gap="$space.sm" onPress={() => router.back()}>
						<ChevronLeft color={theme.text.val} size={24} />
						<SizableText ff="$body" fos="$md" fow="$semiBold" col="$text">
							Back
						</SizableText>
					</XStack>
					<YStack f={1} ai="center" jc="center" gap="$space.sm">
						<SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
							Meal not found
						</SizableText>
						<SizableText ff="$body" fos="$md" col="$textSubtle" textAlign="center">
							The selected meal does not exist in the current mock dataset.
						</SizableText>
					</YStack>
				</YStack>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.background.val }}>
			<StatusBar barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'} />
			<YStack f={1} bg="$background">
				<YStack h={320} bg="$surface" px="$space.md" pt="$space.md" pos="relative">
					<XStack
						ai="center"
						jc="center"
						w={48}
						h={48}
						br="$pill"
						bg="$background"
						pressStyle={{ opacity: 0.8, scale: 0.98 }}
						onPress={() => router.back()}
					>
						<ChevronLeft color={theme.text.val} size={24} />
					</XStack>
				</YStack>

                <ScrollView f={1} showsVerticalScrollIndicator={false} mt={-24} br="$radius.xl">
                    <YStack bg="$background" pt="$space.sm" px="$space.md" pb="$lg" gap="$space.lg">
                        <YStack ai="center">
                            <YStack w={40} h={4} bg="$color.gray6" br="$pill" />
                        </YStack>

                        <SizableText ff="$heading" fos="$h3" fow="$bold" col="$text">
                            {meal.mealName}
                        </SizableText>

                        <XStack gap="$space.sm" jc="space-between">
                            <MacroStat value={`${meal.totalCalories} Cal`} label="Calories" color="$yellow6" />
                            <MacroStat value={`${meal.totalCarbs} g`} label="Carbs" color="$green6" />
                            <MacroStat value={`${meal.totalProtein} g`} label="Protein" color="$purple6" />
                            <MacroStat value={`${meal.totalFat} g`} label="Fat" color="$text" />
                        </XStack>

                        <XStack gap="$space.md" flexWrap="wrap">
                            <Tag>
                                <Tag.Icon icon={Clock3} size={16} />
                                <Tag.Text>{meal.cookTime}</Tag.Text>
                            </Tag>
                            <Tag>
                                <Tag.Icon icon={Utensils} size={16} />
                                <Tag.Text>{meal.difficulty}</Tag.Text>
                            </Tag>
                        </XStack>

                        <YStack gap="$space.sm">
                            <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                                Description
                            </SizableText>
                            <SizableText ff="$body" fos="$md" col="$textSubtle">
                                {meal.description}
                            </SizableText>
                        </YStack>

                        <YStack gap="$space.sm">
                            <SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
                                Ingredients
                            </SizableText>
                            <YStack gap="$space.sm">
                                {meal.ingredients.map((ingredient, index) => (
                                    <YStack key={`${meal.id}-${ingredient.name}`} gap="$space.sm">
                                        <XStack ai="center" jc="space-between" gap="$space.md">
                                            <SizableText ff="$body" fos="$md" fow="$medium" col="$text" flex={1}>
                                                {ingredient.name}
                                            </SizableText>
                                            <SizableText ff="$body" fos="$md" fow="$medium" col="$textSubtle">
                                                {ingredient.amount}
                                            </SizableText>
                                        </XStack>
                                        {index < meal.ingredients.length - 1 ? <YStack h={1} bg="$color.gray6" /> : null}
                                    </YStack>
                                ))}
                            </YStack>
                        </YStack>
                    </YStack>
                </ScrollView>
            </YStack>

				
            <YStack p="$space.md"  bg="$background" >
                <Button w="100%" color="primary" size="large">
                    <Button.Text>Add to Meal</Button.Text>
                </Button>
            </YStack>
		</SafeAreaView>
	);
}
