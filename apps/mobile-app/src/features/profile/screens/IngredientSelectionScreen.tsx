import { ChevronLeft, X } from '@tamagui/lucide-icons-2'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SizableText, XStack, YStack, useTheme } from 'tamagui'
import { useRouter } from 'expo-router'

import { Button, Chip, Divider, type ChipTone, InputSearch } from '@components'
import type { IngredientSummary } from '@meal/shared/types/ingredient'

import {
	fetchIngredientCatalog,
	getIngredientConflictResponse,
} from '../api/profile.api'
import {
	resolveApiErrorMessage,
	summarizeConflictIngredientNames,
} from '../utils/profile-form'

import type { IngredientConflictModalProps } from './IngredientConflictModalBase'

import { useSession } from '@/providers/AuthProvider'

type IngredientListResponse = {
	list: IngredientSummary[]
}

type IngredientUpdateConfig = {
	accessToken: string
	payload: {
		ingredientIds: number[]
	}
}

type IngredientSelectionScreenProps = {
	title: string
	selectedTone: Extract<ChipTone, 'brand' | 'danger'>
	loadSelectedIngredients: (accessToken: string) => Promise<IngredientListResponse>
	loadConflictingIngredients: (accessToken: string) => Promise<IngredientListResponse>
	saveSelectedIngredients: (config: IngredientUpdateConfig) => Promise<IngredientListResponse>
	saveConflictingIngredients: (config: IngredientUpdateConfig) => Promise<IngredientListResponse>
	ConflictModal: React.ComponentType<IngredientConflictModalProps>
}

const INGREDIENT_CATALOG_PAGE_SIZE = 30
const LOAD_MORE_THRESHOLD = 120

export function IngredientSelectionScreen({
	title,
	selectedTone,
	loadSelectedIngredients,
	loadConflictingIngredients,
	saveSelectedIngredients,
	saveConflictingIngredients,
	ConflictModal,
}: IngredientSelectionScreenProps) {
	const router = useRouter()
	const theme = useTheme()
	const { session } = useSession()
	const [isConflictModalOpen, setIsConflictModalOpen] = useState(false)
	const [isLoading, setIsLoading] = useState(true)
	const [isSaving, setIsSaving] = useState(false)
	const [screenError, setScreenError] = useState<string | null>(null)
	const [searchValue, setSearchValue] = useState('')
	const [selectedItems, setSelectedItems] = useState<IngredientSummary[]>([])
	const [catalogItems, setCatalogItems] = useState<IngredientSummary[]>([])
	const [catalogPage, setCatalogPage] = useState(1)
	const [hasMoreCatalogItems, setHasMoreCatalogItems] = useState(false)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [conflictItems, setConflictItems] = useState<IngredientSummary[]>([])

	const loadInitialData = useCallback(async () => {
		if (!session?.accessToken) {
			setScreenError('Missing access token. Please sign in again.')
			setIsLoading(false)
			return
		}

		setIsLoading(true)
		setScreenError(null)

		try {
			const [selectedResponse, catalogResponse] = await Promise.all([
				loadSelectedIngredients(session.accessToken),
				fetchIngredientCatalog({
					query: {
						q: '',
						page: 1,
						pageSize: INGREDIENT_CATALOG_PAGE_SIZE,
					},
				}),
			])

			setSelectedItems(selectedResponse.list)
			setCatalogItems(catalogResponse.items)
			setCatalogPage(catalogResponse.page)
			setHasMoreCatalogItems(catalogResponse.hasMore)
		} catch (error) {
			setScreenError(resolveApiErrorMessage(error, 'Unable to load ingredients.'))
		} finally {
			setIsLoading(false)
		}
	}, [loadSelectedIngredients, session?.accessToken])

	useEffect(() => {
		void loadInitialData()
	}, [loadInitialData])

	useEffect(() => {
		let isActive = true
		const timeoutId = setTimeout(() => {
			void (async () => {
				try {
					setScreenError(null)
					const response = await fetchIngredientCatalog({
						query: {
							q: searchValue.trim(),
							page: 1,
							pageSize: INGREDIENT_CATALOG_PAGE_SIZE,
						},
					})

					if (isActive) {
						setCatalogItems(response.items)
						setCatalogPage(response.page)
						setHasMoreCatalogItems(response.hasMore)
					}
				} catch (error) {
					if (isActive) {
						setScreenError(
							resolveApiErrorMessage(error, 'Unable to search ingredients.'),
						)
					}
				}
			})()
		}, 500)

		return () => {
			isActive = false
			clearTimeout(timeoutId)
		}
	}, [searchValue])

	const normalizedSearchValue = searchValue.trim().toLowerCase()

	const matchesSearch = (ingredient: IngredientSummary) =>
		normalizedSearchValue.length === 0 || ingredient.name.toLowerCase().includes(normalizedSearchValue)

	const visibleSelectedItems = selectedItems.filter(matchesSearch)
	const selectedIngredientIds = new Set(selectedItems.map((ingredient) => ingredient.id))
	const visibleAvailableItems = catalogItems.filter(
		(ingredient) => !selectedIngredientIds.has(ingredient.id) && matchesSearch(ingredient),
	)

	const handleToggleIngredient = (ingredient: IngredientSummary) => {
		setSelectedItems((currentItems) =>
			currentItems.some((item) => item.id === ingredient.id)
				? currentItems.filter((item) => item.id !== ingredient.id)
				: [...currentItems, ingredient],
		)
	}

	const loadMoreCatalogItems = useCallback(async () => {
		if (isLoading || isLoadingMore || !hasMoreCatalogItems) {
			return
		}

		setIsLoadingMore(true)

		try {
			const response = await fetchIngredientCatalog({
				query: {
					q: searchValue.trim(),
					page: catalogPage + 1,
					pageSize: INGREDIENT_CATALOG_PAGE_SIZE,
				},
			})

			setCatalogItems((currentItems) => mergeIngredientItems(currentItems, response.items))
			setCatalogPage(response.page)
			setHasMoreCatalogItems(response.hasMore)
		} catch (error) {
			setScreenError(resolveApiErrorMessage(error, 'Unable to load more ingredients.'))
		} finally {
			setIsLoadingMore(false)
		}
	}, [catalogPage, hasMoreCatalogItems, isLoading, isLoadingMore, searchValue])

	const handleCatalogScroll = useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
			const isNearBottom =
				layoutMeasurement.height + contentOffset.y >=
				contentSize.height - LOAD_MORE_THRESHOLD

			if (!isNearBottom) {
				return
			}

			void loadMoreCatalogItems()
		},
		[loadMoreCatalogItems],
	)

	const saveSelection = useCallback(async () => {
		if (!session?.accessToken) {
			setScreenError('Missing access token. Please sign in again.')
			return
		}

		setIsSaving(true)
		setScreenError(null)

		try {
			await saveSelectedIngredients({
				accessToken: session.accessToken,
				payload: {
					ingredientIds: selectedItems.map((item) => item.id),
				},
			})

			router.back()
		} catch (error) {
			const conflictResponse = getIngredientConflictResponse(error)
			if (conflictResponse) {
				setConflictItems(conflictResponse.items)
				setIsConflictModalOpen(true)
				return
			}

			setScreenError(resolveApiErrorMessage(error, 'Unable to save ingredient changes.'))
		} finally {
			setIsSaving(false)
		}
	}, [router, saveSelectedIngredients, selectedItems, session?.accessToken])

	const handleConfirmConflict = useCallback(async () => {
		if (!session?.accessToken) {
			setScreenError('Missing access token. Please sign in again.')
			return
		}

		setIsSaving(true)
		setScreenError(null)

		try {
			const latestConflicting = await loadConflictingIngredients(session.accessToken)
			const conflictingIds = new Set(conflictItems.map((item) => item.id))
			const nextConflictingIds = latestConflicting.list
				.filter((item) => !conflictingIds.has(item.id))
				.map((item) => item.id)

			await saveConflictingIngredients({
				accessToken: session.accessToken,
				payload: {
					ingredientIds: nextConflictingIds,
				},
			})

			await saveSelectedIngredients({
				accessToken: session.accessToken,
				payload: {
					ingredientIds: selectedItems.map((item) => item.id),
				},
			})

			setIsConflictModalOpen(false)
			router.back()
		} catch (error) {
			setScreenError(resolveApiErrorMessage(error, 'Unable to resolve ingredient conflict.'))
		} finally {
			setIsSaving(false)
		}
	}, [
		conflictItems,
		loadConflictingIngredients,
		router,
		saveConflictingIngredients,
		saveSelectedIngredients,
		selectedItems,
		session?.accessToken,
	])

	const visibleConflictLabels = useMemo(() => {
		return summarizeConflictIngredientNames(conflictItems)
	}, [conflictItems])

	if (isLoading) {
		return (
			<SafeAreaView style={[{ flex: 1 }, { backgroundColor: theme.background.val }]}>
				<YStack f={1} bg="$background" ai="center" jc="center" px="$md" gap="$sm">
					<SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
						Loading ingredients
					</SizableText>
				</YStack>
			</SafeAreaView>
		)
	}

	return (
		<SafeAreaView style={[{ flex: 1 }, { backgroundColor: theme.background.val }]}>
			<YStack f={1} bg="$background">
				<YStack f={1} px="$md" pt="$md" gap="$lg">
					<XStack h={40} ai="center" jc="center" pos="relative">
						<XStack pos="absolute" l={0} p="$xs" onPress={() => router.back()} pressStyle={{ opacity: 0.7 }}>
							<ChevronLeft color={theme.text.val} size={24} />
						</XStack>
						<SizableText ff="$heading" fos="$h4" fow="$bold" col="$text">
							{title}
						</SizableText>
					</XStack>

					<ScrollView
						style={{ flex: 1 }}
						contentContainerStyle={{ paddingBottom: 16 }}
						scrollEventThrottle={16}
						keyboardShouldPersistTaps="handled"
						onScroll={handleCatalogScroll}
					>
						<YStack gap="$lg">
							<InputSearch
								placeholder="Search ingredients..."
								value={searchValue}
								onChangeText={setSearchValue}
							/>

							{screenError ? (
								<SizableText ff="$body" fos="$sm" col="$danger">
									{screenError}
								</SizableText>
							) : null}

							<XStack flexWrap="wrap" gap="$sm">
								{visibleSelectedItems.map((ingredient) => (
									<Chip key={ingredient.id} tone={selectedTone} onPress={() => handleToggleIngredient(ingredient)}>
										<Chip.Text>{ingredient.name}</Chip.Text>
										<Chip.Icon icon={X} />
									</Chip>
								))}
							</XStack>

							<Divider label="Ingredients" />

							<XStack flexWrap="wrap" gap="$sm">
								{visibleAvailableItems.length > 0 ? (
									visibleAvailableItems.map((ingredient) => (
										<Chip key={ingredient.id} tone="neutral" onPress={() => handleToggleIngredient(ingredient)}>
											<Chip.Text>{ingredient.name}</Chip.Text>
										</Chip>
									))
								) : (
									<SizableText ff="$body" fos="$md" col="$textSubtle">
										No ingredients found.
									</SizableText>
								)}
							</XStack>

							{isLoadingMore ? (
								<XStack ai="center" jc="center" py="$md">
									<ActivityIndicator color={theme.primary.val} />
								</XStack>
							) : null}

							{!isLoadingMore && !hasMoreCatalogItems && catalogItems.length > 0 ? (
								<SizableText ff="$body" fos="$sm" col="$textSubtle" ta="center" py="$sm">
									No more ingredients to load.
								</SizableText>
							) : null}
						</YStack>
					</ScrollView>
				</YStack>

				<YStack px="$md" pb="$lg" pt="$sm">
					<Button color="primary" size="large" disabled={isSaving} onPress={() => void saveSelection()}>
						<Button.Text>{isSaving ? 'Saving...' : 'Save changes'}</Button.Text>
					</Button>
				</YStack>

				<ConflictModal
					open={isConflictModalOpen}
					onOpenChange={setIsConflictModalOpen}
					ingredients={visibleConflictLabels}
					onConfirm={() => void handleConfirmConflict()}
				/>
			</YStack>
		</SafeAreaView>
	)
}

function mergeIngredientItems(
	currentItems: IngredientSummary[],
	nextItems: IngredientSummary[],
) {
	const mergedItems = [...currentItems]
	const existingIds = new Set(currentItems.map((item) => item.id))

	for (const item of nextItems) {
		if (existingIds.has(item.id)) {
			continue
		}

		existingIds.add(item.id)
		mergedItems.push(item)
	}

	return mergedItems
}