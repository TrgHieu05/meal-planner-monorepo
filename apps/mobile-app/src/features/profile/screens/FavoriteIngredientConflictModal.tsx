import { IngredientConflictModalBase, type IngredientConflictModalProps } from './IngredientConflictModalBase'

const FAVORITE_CONFLICT_INGREDIENTS = ['Chicken', 'Rice', '+ 2 others']

export function FavoriteIngredientConflictModal(props: IngredientConflictModalProps) {
	return (
		<IngredientConflictModalBase
			{...props}
			ingredients={FAVORITE_CONFLICT_INGREDIENTS}
			tone="brand"
			description="The above items are also in your Allergies list. Would you like to remove them from Allergies list to add them to your Favorite Ingredients list?"
		/>
	)
}