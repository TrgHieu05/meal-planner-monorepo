import { IngredientConflictModalBase, type IngredientConflictModalProps } from './IngredientConflictModalBase'

export function FavoriteIngredientConflictModal(props: IngredientConflictModalProps) {
	return (
		<IngredientConflictModalBase
			{...props}
			tone="brand"
			description="The above items are also in your Allergies list. Would you like to remove them from Allergies list to add them to your Favorite Ingredients list?"
		/>
	)
}