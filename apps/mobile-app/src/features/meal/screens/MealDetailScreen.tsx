import { Button, Tag } from '@components';
import { useAppTheme } from '@/providers/AppProviders';
import { AddMealModal } from '@features/menu/screens/AddMealModal';
import { buildAddToMenuLabel, getSingleSearchParam } from '@features/menu/utils/menu-flow';
import { useSession } from '@/providers/AuthProvider';
import { isApiErrorWithStatus } from '@/services/api/http-client';
import { Clock3, Utensils, ChevronLeft } from '@tamagui/lucide-icons-2';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SizableText, ScrollView, XStack, YStack, useTheme } from 'tamagui';

import { fetchMealDetailViewModel } from '../api/meal.api';
import {
	buildTemplateMealPickerLabel,
	parseTemplateMealPickerContext,
	stagePendingTemplateMealSelection,
} from '@features/template/utils/template-meal-picker';

import type { MealDetailViewModel } from '../types';

type MealDetailScreenState = 'loading' | 'ready' | 'notFound' | 'error';

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

function parseMealIdParam(mealIdParam?: string) {
	if (!mealIdParam) {
		return null;
	}

	const mealId = Number(mealIdParam);
	if (!Number.isInteger(mealId) || mealId <= 0) {
		return null;
	}

	return mealId;
}

function resolveMealDetailErrorMessage(error: unknown, fallbackMessage: string) {
	if (error instanceof Error && error.message.trim()) {
		return error.message.trim();
	}

	return fallbackMessage;
}

export default function MealDetailScreen() {
	const theme = useTheme();
	const { themeName } = useAppTheme();
	const { session } = useSession();
	const router = useRouter();
	const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
	const [meal, setMeal] = useState<MealDetailViewModel | null>(null);
	const [screenState, setScreenState] = useState<MealDetailScreenState>('loading');
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [reloadNonce, setReloadNonce] = useState(0);
	const params = useLocalSearchParams<{
		date?: string | string[];
		mealId?: string | string[];
		mealTime?: string | string[];
		source?: string | string[];
		templateDayNumber?: string | string[];
		templateDayUiKey?: string | string[];
	}>();
	const mealIdParam = getSingleSearchParam(params.mealId);
	const mealId = useMemo(() => parseMealIdParam(mealIdParam), [mealIdParam]);
	const mealTimeParam = getSingleSearchParam(params.mealTime);
	const dateParam = getSingleSearchParam(params.date);
	const templatePickerContext = useMemo(
		() =>
			parseTemplateMealPickerContext({
				mealTime: params.mealTime,
				source: params.source,
				templateDayNumber: params.templateDayNumber,
				templateDayUiKey: params.templateDayUiKey,
			}),
		[params.mealTime, params.source, params.templateDayNumber, params.templateDayUiKey],
	);
	const addToMenuLabel = buildAddToMenuLabel(mealTimeParam, dateParam) ?? 'Add to Menu';
	const actionButtonLabel = templatePickerContext
		? buildTemplateMealPickerLabel(templatePickerContext)
		: addToMenuLabel;
	const hasLockedAddMealContext = Boolean(mealTimeParam && dateParam);

	useEffect(() => {
		if (mealId === null) {
			setMeal(null);
			setErrorMessage(null);
			setScreenState('notFound');
			return;
		}

		if (!session?.accessToken) {
			setMeal(null);
			setErrorMessage('Missing access token. Please sign in again.');
			setScreenState('error');
			return;
		}

		let isActive = true;
		setScreenState('loading');
		setErrorMessage(null);

		void (async () => {
			try {
				const nextMeal = await fetchMealDetailViewModel({
					accessToken: session.accessToken,
					mealId,
				});

				if (!isActive) {
					return;
				}

				setMeal(nextMeal);
				setScreenState('ready');
			} catch (error) {
				if (!isActive) {
					return;
				}

				setMeal(null);

				if (isApiErrorWithStatus(error, 404)) {
					setErrorMessage(null);
					setScreenState('notFound');
					return;
				}

				setErrorMessage(
					resolveMealDetailErrorMessage(error, 'Unable to load meal details right now.'),
				);
				setScreenState('error');
			}
		})();

		return () => {
			isActive = false;
		};
	}, [mealId, reloadNonce, session?.accessToken]);

	function handleRetry() {
		setReloadNonce((currentValue) => currentValue + 1);
	}

	function handleAddMealSuccess() {
		if (!hasLockedAddMealContext || !dateParam) {
			return;
		}

		router.replace({
			pathname: '/menu',
			params: {
				date: dateParam,
			},
		});
	}

	function handleAddTemplateMeal() {
		if (!meal || !templatePickerContext) {
			return;
		}

		stagePendingTemplateMealSelection({
			...templatePickerContext,
			mealId: meal.mealId,
			mealName: meal.mealName,
			cookTime: meal.cookTime,
			difficulty: meal.difficulty,
			nutritionPerServing: {
				calories: parseMealNutritionValue(meal.totalCalories),
				protein: parseMealNutritionValue(meal.totalProtein),
				fiber: parseMealNutritionValue(meal.totalFiber),
				fat: parseMealNutritionValue(meal.totalFat),
			},
		});

		router.back();
	}

	function renderBackAction() {
		return (
			<XStack ai="center" gap="$space.sm" onPress={() => router.back()}>
				<ChevronLeft color={theme.text.val} size={24} />
				<SizableText ff="$body" fos="$md" fow="$semiBold" col="$text">
					Back
				</SizableText>
			</XStack>
		);
	}

	if (screenState === 'loading') {
		return (
			<SafeAreaView style={{ flex: 1, backgroundColor: theme.background.val }}>
				<StatusBar barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'} />
				<YStack f={1} px="$space.md" py="$space.lg" gap="$space.lg" bg="$background">
					{renderBackAction()}
					<YStack f={1} ai="center" jc="center" gap="$space.sm">
						<ActivityIndicator color={theme.primary.val} />
						<SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
							Loading meal details
						</SizableText>
						<SizableText ff="$body" fos="$md" col="$textSubtle" textAlign="center">
							Fetching the latest meal information from the server.
						</SizableText>
					</YStack>
				</YStack>
			</SafeAreaView>
		);
	}

	if (screenState === 'notFound' || !meal) {
		return (
			<SafeAreaView style={{ flex: 1, backgroundColor: theme.background.val }}>
				<StatusBar barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'} />
				<YStack f={1} px="$space.md" py="$space.lg" gap="$space.lg" bg="$background">
					{renderBackAction()}
					<YStack f={1} ai="center" jc="center" gap="$space.sm">
						<SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
							Meal not found
						</SizableText>
						<SizableText ff="$body" fos="$md" col="$textSubtle" textAlign="center">
							The selected meal does not exist or is no longer available.
						</SizableText>
					</YStack>
				</YStack>
			</SafeAreaView>
		);
	}

	if (screenState === 'error') {
		return (
			<SafeAreaView style={{ flex: 1, backgroundColor: theme.background.val }}>
				<StatusBar barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'} />
				<YStack f={1} px="$space.md" py="$space.lg" gap="$space.lg" bg="$background">
					{renderBackAction()}
					<YStack f={1} ai="center" jc="center" gap="$space.md">
						<SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
							Unable to load meal details
						</SizableText>
						<SizableText ff="$body" fos="$md" col="$danger" textAlign="center">
							{errorMessage ?? 'Unable to load meal details right now.'}
						</SizableText>
						<Button color="secondary" onPress={handleRetry}>
							<Button.Text>Retry</Button.Text>
						</Button>
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
					<YStack f={1} ai="center" jc="center" gap="$space.sm">
						<SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
							Meal photo coming soon
						</SizableText>
						<SizableText ff="$body" fos="$md" col="$textSubtle" textAlign="center">
							A placeholder is shown here until real meal images are integrated.
						</SizableText>
					</YStack>
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
							<MacroStat value={`${meal.totalFiber} g`} label="Fiber" color="$green6" />
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
									<YStack key={`${meal.mealId}-${ingredient.id}`} gap="$space.sm">
                                        <XStack ai="center" jc="space-between" gap="$space.md">
                                            <SizableText ff="$body" fos="$md" fow="$medium" col="$text" flex={1}>
                                                {ingredient.name}
                                            </SizableText>
                                            <SizableText ff="$body" fos="$md" fow="$medium" col="$textSubtle">
												{ingredient.quantityLabel}
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
						<Button
							w="100%"
							color="primary"
							size="large"
							onPress={() => {
								if (templatePickerContext) {
									handleAddTemplateMeal();
									return;
								}

								setIsAddMealModalOpen(true);
							}}
						>
					    <Button.Text>{actionButtonLabel}</Button.Text>
                </Button>
            </YStack>

					{!templatePickerContext ? (
						<AddMealModal
							open={isAddMealModalOpen}
							onOpenChange={setIsAddMealModalOpen}
							mealId={meal.mealId}
							hideDateAndMealTime={hasLockedAddMealContext}
							lockedDate={dateParam}
							lockedMealTime={mealTimeParam}
							onSuccess={handleAddMealSuccess}
						/>
					) : null}
		</SafeAreaView>
	);
}

	function parseMealNutritionValue(value: string) {
		const parsedValue = Number.parseFloat(value);

		return Number.isFinite(parsedValue) ? parsedValue : 0;
	}
