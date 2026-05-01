import { IngredientConflictModalBase, type IngredientConflictModalProps } from './IngredientConflictModalBase'

const ALLERGY_CONFLICT_INGREDIENTS = ['Peanut', 'Dairy', '+ 2 others']

export function AllergyConflictModal(props: IngredientConflictModalProps) {
	return (
		<IngredientConflictModalBase
			{...props}
			ingredients={ALLERGY_CONFLICT_INGREDIENTS}
			tone="danger"
			description="The above items are also in your Favorite Ingredients list. Would you like to remove them from Favorite Ingredients list to add them to your Allergies list?"
		/>
	)
}