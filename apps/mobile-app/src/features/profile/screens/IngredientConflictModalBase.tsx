import { Modal, Pressable, StyleSheet } from 'react-native'
import { SizableText, XStack, YStack } from 'tamagui'

import { Chip, type ChipTone } from '@components'

export type IngredientConflictModalProps = {
	open: boolean
	onOpenChange: (open: boolean) => void
	onConfirm: () => void
	ingredients: string[]
}

type IngredientConflictModalBaseProps = IngredientConflictModalProps & {
	description: string
	tone: Extract<ChipTone, 'brand' | 'danger'>
}

type ActionButtonProps = {
	label: string
	tone: 'secondary' | 'danger'
	onPress: () => void
}

function ActionButton({ label, tone, onPress }: ActionButtonProps) {
	const textColor = tone === 'danger' ? '$textInverse' : '$text'

	return (
		<XStack
			f={1}
			h={44}
			br="$pill"
			bg={tone === 'danger' ? '$danger' : '$surface'}
			ai="center"
			jc="center"
			onPress={onPress}
			pressStyle={{
				opacity: 0.88,
				scale: 0.98,
			}}
		>
			<SizableText ff="$body" fos="$md" fow="$semiBold" col={textColor}>
				{label}
			</SizableText>
		</XStack>
	)
}

export function IngredientConflictModalBase({
	open,
	onOpenChange,
	onConfirm,
	ingredients,
	description,
	tone,
}: IngredientConflictModalBaseProps) {
	return (
		<Modal
			animationType="fade"
			transparent
			statusBarTranslucent
			visible={open}
			onRequestClose={() => onOpenChange(false)}
		>
			<YStack f={1} ai="center" jc="center" px="$md" style={styles.backdrop}>
				<Pressable onPress={() => onOpenChange(false)} style={StyleSheet.absoluteFill} />
				<YStack
					w="100%"
					maw={360}
					bg="$background"
					br="$xl"
					p="$lg"
					gap="$lg"
					ai="center"
					shac="$color.gray14"
					shop={0.1}
					shar={20}
					shof={{ width: 0, height: 10 }}
					elevation={16}
				>
					<SizableText ff="$heading" fos={20} fow="$bold" col="$text" ta="center">
						Ingredient Conflict
					</SizableText>

					<XStack flexWrap="wrap" ai="center" jc="center" gap="$sm" w="100%">
						{ingredients.map((ingredient) => (
							<Chip key={ingredient} tone={tone}>
								<Chip.Text>{ingredient}</Chip.Text>
							</Chip>
						))}
					</XStack>

					<SizableText ff="$body" fos="$md" col="$text" ta="center" fow="$regular">
						{description}
					</SizableText>

					<XStack w="100%" gap="$md">
						<ActionButton label="Cancel" tone="secondary" onPress={() => onOpenChange(false)} />
						<ActionButton label="Remove" tone="danger" onPress={onConfirm} />
					</XStack>
				</YStack>
			</YStack>
		</Modal>
	)
}

const styles = StyleSheet.create({
	backdrop: {
		backgroundColor: 'rgba(42, 42, 42, 0.28)',
	},
})