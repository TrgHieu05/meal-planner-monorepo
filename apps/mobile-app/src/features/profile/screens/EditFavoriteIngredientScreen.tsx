import { FavoriteIngredientConflictModal } from './FavoriteIngredientConflictModal'
import { IngredientSelectionScreen } from './IngredientSelectionScreen'

const FAVORITE_INGREDIENTS = ['Chicken', 'Rice', 'Beef', 'Broccoli', 'Salmon']
const AVAILABLE_INGREDIENTS = ['Cherry', 'Apple', 'Banana', 'Bean']

export default function EditFavoriteIngredientScreen() {
	return (
		<IngredientSelectionScreen
			title="Edit Favorite Ingredient"
			selectedTone="brand"
			selectedIngredients={FAVORITE_INGREDIENTS}
			availableIngredients={AVAILABLE_INGREDIENTS}
			ConflictModal={FavoriteIngredientConflictModal}
		/>
	)
}