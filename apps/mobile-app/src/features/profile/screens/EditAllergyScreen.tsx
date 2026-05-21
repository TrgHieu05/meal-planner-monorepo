import { AllergyConflictModal } from './AllergyConflictModal'
import { IngredientSelectionScreen } from './IngredientSelectionScreen'

import {
	fetchAllergies,
	fetchFavoriteIngredients,
	updateAllergies,
	updateFavoriteIngredients,
} from '../api/profile.api'

export default function EditAllergyScreen() {
	return (
		<IngredientSelectionScreen
			title="Edit Allergy"
			selectedTone="danger"
			loadSelectedIngredients={(accessToken) => fetchAllergies({ accessToken })}
			loadConflictingIngredients={(accessToken) =>
				fetchFavoriteIngredients({ accessToken })
			}
			saveSelectedIngredients={updateAllergies}
			saveConflictingIngredients={updateFavoriteIngredients}
			ConflictModal={AllergyConflictModal}
		/>
	)
}