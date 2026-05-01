import { FavoriteIngredientConflictModal } from './FavoriteIngredientConflictModal'
import { IngredientSelectionScreen } from './IngredientSelectionScreen'

import {
	fetchAllergies,
	fetchFavoriteIngredients,
	updateAllergies,
	updateFavoriteIngredients,
} from '../api/profile.api'

export default function EditFavoriteIngredientScreen() {
	return (
		<IngredientSelectionScreen
			title="Edit Favorite Ingredient"
			selectedTone="brand"
			loadSelectedIngredients={(accessToken) =>
				fetchFavoriteIngredients({ accessToken })
			}
			loadConflictingIngredients={(accessToken) => fetchAllergies({ accessToken })}
			saveSelectedIngredients={updateFavoriteIngredients}
			saveConflictingIngredients={updateAllergies}
			ConflictModal={FavoriteIngredientConflictModal}
		/>
	)
}