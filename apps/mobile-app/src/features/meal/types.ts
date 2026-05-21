export type MealDifficultyLabel = 'Easy' | 'Medium' | 'Hard';

export type MealSearchCardViewModel = {
  mealId: number;
  mealName: string;
  mealImageKey: string | null;
  mealCardImageUrl: string | null;
  cookTime: string;
  difficulty: MealDifficultyLabel;
  totalCalories: string;
  totalProtein: string;
  totalFiber: string;
  totalFat: string;
  score: number;
};

export type MealSearchScreenData = {
  list: MealSearchCardViewModel[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export type MealDetailIngredientViewModel = {
  id: number;
  name: string;
  quantity: number;
  quantityLabel: string;
};

export type MealDetailViewModel = {
  mealId: number;
  mealName: string;
  mealImageKey: string | null;
  mealDetailImageUrl: string | null;
  description: string;
  cuisineTypeName: string;
  difficulty: MealDifficultyLabel;
  cookTime: string;
  totalCalories: string;
  totalProtein: string;
  totalFiber: string;
  totalFat: string;
  ingredients: MealDetailIngredientViewModel[];
};