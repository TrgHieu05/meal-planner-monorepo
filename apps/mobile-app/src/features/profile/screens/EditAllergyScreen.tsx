import { AllergyConflictModal } from './AllergyConflictModal'
import { IngredientSelectionScreen } from './IngredientSelectionScreen'

const ALLERGY_INGREDIENTS = ['Peanut', 'Dairy', 'Soy', 'Tree Nut', 'Shellfish']
const AVAILABLE_INGREDIENTS = ['Apple', 'Banana', 'Bean', 'Mushroom']

export default function EditAllergyScreen() {
	return (
		<IngredientSelectionScreen
			title="Edit Allergy"
			selectedTone="danger"
			selectedIngredients={ALLERGY_INGREDIENTS}
			availableIngredients={AVAILABLE_INGREDIENTS}
			ConflictModal={AllergyConflictModal}
		/>
	)
}