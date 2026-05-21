import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  IngredientListConflictResponseSchema,
  IngredientSummary,
} from '@meal/shared/types/ingredient';

type IngredientConflictTarget = 'allergies' | 'favoriteIngredients';

export function createIngredientConflictException(params: {
  conflictWith: IngredientConflictTarget;
  items: IngredientSummary[];
}) {
  const parsed = IngredientListConflictResponseSchema.safeParse({
    statusCode: 409,
    message: buildConflictMessage(params.conflictWith),
    code: 'INGREDIENT_LIST_CONFLICT',
    conflictWith: params.conflictWith,
    items: params.items,
  });

  if (!parsed.success) {
    throw new InternalServerErrorException(
      'Failed to map ingredient conflict data.',
    );
  }

  return new ConflictException(parsed.data);
}

function buildConflictMessage(conflictWith: IngredientConflictTarget) {
  return conflictWith === 'favoriteIngredients'
    ? 'Ingredient selection conflicts with favorite ingredients.'
    : 'Ingredient selection conflicts with allergies.';
}