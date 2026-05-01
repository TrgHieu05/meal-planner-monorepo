import { ChevronLeft, X } from '@tamagui/lucide-icons-2'
import { useMemo, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SizableText, XStack, YStack, useTheme } from 'tamagui'
import { useRouter } from 'expo-router'

import { Button, Chip, Divider, type ChipTone, InputSearch } from '@components'

import type { IngredientConflictModalProps } from './IngredientConflictModalBase'

type IngredientSelectionScreenProps = {
	title: string
	selectedTone: Extract<ChipTone, 'brand' | 'danger'>
	selectedIngredients: string[]
	availableIngredients: string[]
	ConflictModal: React.ComponentType<IngredientConflictModalProps>
}

export function IngredientSelectionScreen({
	title,
	selectedTone,
	selectedIngredients,
	availableIngredients,
	ConflictModal,
}: IngredientSelectionScreenProps) {
	const router = useRouter()
	const theme = useTheme()
	const [isConflictModalOpen, setIsConflictModalOpen] = useState(false)
	const [searchValue, setSearchValue] = useState('')
	const [selectedItems, setSelectedItems] = useState(selectedIngredients)

	const allIngredients = useMemo(
		() => [...selectedIngredients, ...availableIngredients],
		[selectedIngredients, availableIngredients],
	)

	const normalizedSearchValue = searchValue.trim().toLowerCase()

	const matchesSearch = (ingredient: string) =>
		normalizedSearchValue.length === 0 || ingredient.toLowerCase().includes(normalizedSearchValue)

	const visibleSelectedItems = selectedItems.filter(matchesSearch)
	const visibleAvailableItems = allIngredients.filter(
		(ingredient) => !selectedItems.includes(ingredient) && matchesSearch(ingredient),
	)

	const handleToggleIngredient = (ingredient: string) => {
		setSelectedItems((currentItems) =>
			currentItems.includes(ingredient)
				? currentItems.filter((item) => item !== ingredient)
				: [...currentItems, ingredient],
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

					<YStack f={1} gap="$lg">
						<InputSearch
							placeholder="Search ingredients..."
							value={searchValue}
							onChangeText={setSearchValue}
						/>

						<XStack flexWrap="wrap" gap="$sm">
							{visibleSelectedItems.map((ingredient) => (
								<Chip key={ingredient} tone={selectedTone} onPress={() => handleToggleIngredient(ingredient)}>
									<Chip.Text>{ingredient}</Chip.Text>
									<Chip.Icon icon={X} />
								</Chip>
							))}
						</XStack>

						<Divider label="Ingredients" />

						<XStack flexWrap="wrap" gap="$sm">
							{visibleAvailableItems.map((ingredient) => (
								<Chip key={ingredient} tone="neutral" onPress={() => handleToggleIngredient(ingredient)}>
									<Chip.Text>{ingredient}</Chip.Text>
								</Chip>
							))}
						</XStack>
					</YStack>
				</YStack>

				<YStack px="$md" pb="$lg" pt="$sm">
					<Button color="primary" size="large" onPress={() => setIsConflictModalOpen(true)}>
						<Button.Text>Save changes</Button.Text>
					</Button>
				</YStack>

				<ConflictModal
					open={isConflictModalOpen}
					onOpenChange={setIsConflictModalOpen}
					onConfirm={() => {
						setIsConflictModalOpen(false)
						router.replace('/profile')
					}}
				/>
			</YStack>
		</SafeAreaView>
	)
}