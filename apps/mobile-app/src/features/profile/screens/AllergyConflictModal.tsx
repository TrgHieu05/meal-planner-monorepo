import { IngredientConflictModalBase, type IngredientConflictModalProps } from './IngredientConflictModalBase'

export function AllergyConflictModal(props: IngredientConflictModalProps) {
	return (
		<IngredientConflictModalBase
			{...props}
			tone="danger"
			description="The above items are also in your Favorite Ingredients list. Would you like to remove them from Favorite Ingredients list to add them to your Allergies list?"
		/>
	)
}