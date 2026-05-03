export interface MockMealIngredient {
  name: string;
  amount: string;
}

export interface MockMeal {
  id: string;
  mealName: string;
  cookTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  totalCalories: string;
  totalProtein: string;
  totalCarbs: string;
  totalFat: string;
  description: string;
  ingredients: MockMealIngredient[];
}

export const mockMeals: MockMeal[] = [
  {
    id: 'meal-1',
    mealName: 'Grilled Salmon Bowl',
    cookTime: '20 mins',
    difficulty: 'Medium',
    totalCalories: '450',
    totalProtein: '35',
    totalCarbs: '12',
    totalFat: '22',
    description:
      'A balanced salmon bowl with fluffy rice, roasted vegetables, and a light sesame dressing for a filling mid-day meal.',
    ingredients: [
      { name: 'Salmon fillet', amount: '180 g' },
      { name: 'Brown rice', amount: '1 cup' },
      { name: 'Broccoli', amount: '80 g' },
      { name: 'Carrot ribbons', amount: '40 g' },
      { name: 'Sesame dressing', amount: '2 tbsp' },
    ],
  },
  {
    id: 'meal-2',
    mealName: 'Chicken Avocado Wrap',
    cookTime: '15 mins',
    difficulty: 'Easy',
    totalCalories: '390',
    totalProtein: '28',
    totalCarbs: '24',
    totalFat: '14',
    description:
      'Tender chicken breast, creamy avocado, and crisp greens wrapped in a soft tortilla for a quick high-protein lunch.',
    ingredients: [
      { name: 'Whole wheat tortilla', amount: '1 wrap' },
      { name: 'Grilled chicken', amount: '120 g' },
      { name: 'Avocado', amount: '1/2 fruit' },
      { name: 'Romaine lettuce', amount: '1 cup' },
      { name: 'Greek yogurt sauce', amount: '1 tbsp' },
    ],
  },
  {
    id: 'meal-3',
    mealName: 'Tofu Veggie Stir Fry',
    cookTime: '25 mins',
    difficulty: 'Medium',
    totalCalories: '410',
    totalProtein: '22',
    totalCarbs: '36',
    totalFat: '13',
    description:
      'Crispy tofu tossed with colorful vegetables in a savory soy-ginger sauce, served hot for a simple plant-based dinner.',
    ingredients: [
      { name: 'Firm tofu', amount: '160 g' },
      { name: 'Bell peppers', amount: '90 g' },
      { name: 'Snap peas', amount: '70 g' },
      { name: 'Cooked rice noodles', amount: '120 g' },
      { name: 'Soy-ginger sauce', amount: '2 tbsp' },
    ],
  },
  {
    id: 'meal-4',
    mealName: 'Greek Yogurt Parfait',
    cookTime: '10 mins',
    difficulty: 'Easy',
    totalCalories: '280',
    totalProtein: '18',
    totalCarbs: '30',
    totalFat: '8',
    description:
      'A refreshing parfait layered with Greek yogurt, berries, and crunchy granola for a light breakfast or snack.',
    ingredients: [
      { name: 'Greek yogurt', amount: '200 g' },
      { name: 'Mixed berries', amount: '90 g' },
      { name: 'Granola', amount: '35 g' },
      { name: 'Honey', amount: '1 tsp' },
    ],
  },
  {
    id: 'meal-5',
    mealName: 'Beef Teriyaki Rice Bowl',
    cookTime: '30 mins',
    difficulty: 'Medium',
    totalCalories: '520',
    totalProtein: '31',
    totalCarbs: '48',
    totalFat: '19',
    description:
      'Sliced beef glazed with teriyaki sauce over steamed rice with green onions and sauteed vegetables.',
    ingredients: [
      { name: 'Beef sirloin', amount: '150 g' },
      { name: 'Jasmine rice', amount: '1 cup' },
      { name: 'Mushrooms', amount: '60 g' },
      { name: 'Green onion', amount: '15 g' },
      { name: 'Teriyaki sauce', amount: '3 tbsp' },
    ],
  },
  {
    id: 'meal-6',
    mealName: 'Shrimp Pasta Primavera',
    cookTime: '35 mins',
    difficulty: 'Hard',
    totalCalories: '560',
    totalProtein: '29',
    totalCarbs: '54',
    totalFat: '21',
    description:
      'Shrimp and seasonal vegetables folded through al dente pasta with garlic, olive oil, and parmesan.',
    ingredients: [
      { name: 'Shrimp', amount: '160 g' },
      { name: 'Penne pasta', amount: '140 g' },
      { name: 'Zucchini', amount: '70 g' },
      { name: 'Cherry tomatoes', amount: '80 g' },
      { name: 'Parmesan', amount: '20 g' },
    ],
  },
  {
    id: 'meal-7',
    mealName: 'Turkey Quinoa Salad',
    cookTime: '18 mins',
    difficulty: 'Easy',
    totalCalories: '340',
    totalProtein: '27',
    totalCarbs: '22',
    totalFat: '11',
    description:
      'Lean turkey and fluffy quinoa combined with fresh cucumbers and herbs in a bright lemon dressing.',
    ingredients: [
      { name: 'Roasted turkey', amount: '110 g' },
      { name: 'Cooked quinoa', amount: '3/4 cup' },
      { name: 'Cucumber', amount: '60 g' },
      { name: 'Parsley', amount: '10 g' },
      { name: 'Lemon dressing', amount: '1 tbsp' },
    ],
  },
  {
    id: 'meal-8',
    mealName: 'Mushroom Risotto',
    cookTime: '40 mins',
    difficulty: 'Hard',
    totalCalories: '470',
    totalProtein: '14',
    totalCarbs: '58',
    totalFat: '17',
    description:
      'Creamy risotto slowly cooked with mushrooms, stock, and parmesan for a comforting dinner plate.',
    ingredients: [
      { name: 'Arborio rice', amount: '140 g' },
      { name: 'Mixed mushrooms', amount: '120 g' },
      { name: 'Vegetable stock', amount: '500 ml' },
      { name: 'Parmesan', amount: '25 g' },
      { name: 'Butter', amount: '10 g' },
    ],
  },
  {
    id: 'meal-9',
    mealName: 'Egg Fried Brown Rice',
    cookTime: '22 mins',
    difficulty: 'Medium',
    totalCalories: '430',
    totalProtein: '16',
    totalCarbs: '49',
    totalFat: '14',
    description:
      'Brown rice stir-fried with eggs, peas, carrots, and scallions for a quick and satisfying weekday meal.',
    ingredients: [
      { name: 'Brown rice', amount: '1 1/2 cup' },
      { name: 'Eggs', amount: '2 large' },
      { name: 'Frozen peas', amount: '50 g' },
      { name: 'Carrots', amount: '40 g' },
      { name: 'Soy sauce', amount: '1 tbsp' },
    ],
  },
  {
    id: 'meal-10',
    mealName: 'Tuna Nicoise Salad',
    cookTime: '17 mins',
    difficulty: 'Easy',
    totalCalories: '360',
    totalProtein: '25',
    totalCarbs: '18',
    totalFat: '16',
    description:
      'A French-style salad with tuna, eggs, green beans, potatoes, and olives dressed with vinaigrette.',
    ingredients: [
      { name: 'Tuna chunks', amount: '120 g' },
      { name: 'Baby potatoes', amount: '100 g' },
      { name: 'Green beans', amount: '70 g' },
      { name: 'Boiled egg', amount: '1 egg' },
      { name: 'Olives', amount: '20 g' },
    ],
  },
  {
    id: 'meal-11',
    mealName: 'Spicy Chicken Burrito',
    cookTime: '28 mins',
    difficulty: 'Medium',
    totalCalories: '610',
    totalProtein: '34',
    totalCarbs: '57',
    totalFat: '24',
    description:
      'A hearty burrito stuffed with spicy chicken, rice, beans, and salsa for a high-energy lunch.',
    ingredients: [
      { name: 'Tortilla wrap', amount: '1 large' },
      { name: 'Spiced chicken', amount: '140 g' },
      { name: 'Black beans', amount: '80 g' },
      { name: 'Cooked rice', amount: '3/4 cup' },
      { name: 'Tomato salsa', amount: '2 tbsp' },
    ],
  },
  {
    id: 'meal-12',
    mealName: 'Pesto Zucchini Noodles',
    cookTime: '16 mins',
    difficulty: 'Easy',
    totalCalories: '300',
    totalProtein: '12',
    totalCarbs: '15',
    totalFat: '18',
    description:
      'Zucchini noodles coated in basil pesto with cherry tomatoes and toasted seeds for a light low-carb plate.',
    ingredients: [
      { name: 'Zucchini noodles', amount: '180 g' },
      { name: 'Basil pesto', amount: '2 tbsp' },
      { name: 'Cherry tomatoes', amount: '70 g' },
      { name: 'Pumpkin seeds', amount: '15 g' },
    ],
  },
  {
    id: 'meal-13',
    mealName: 'Lentil Coconut Curry',
    cookTime: '32 mins',
    difficulty: 'Medium',
    totalCalories: '440',
    totalProtein: '20',
    totalCarbs: '46',
    totalFat: '18',
    description:
      'Red lentils simmered in coconut milk with warming spices and spinach for a creamy one-pot dinner.',
    ingredients: [
      { name: 'Red lentils', amount: '120 g' },
      { name: 'Coconut milk', amount: '200 ml' },
      { name: 'Spinach', amount: '60 g' },
      { name: 'Curry paste', amount: '1 tbsp' },
      { name: 'Basmati rice', amount: '3/4 cup' },
    ],
  },
  {
    id: 'meal-14',
    mealName: 'Steak and Roasted Veggies',
    cookTime: '27 mins',
    difficulty: 'Medium',
    totalCalories: '540',
    totalProtein: '38',
    totalCarbs: '20',
    totalFat: '29',
    description:
      'Juicy steak served with oven-roasted vegetables and herbs for a simple protein-forward dinner.',
    ingredients: [
      { name: 'Sirloin steak', amount: '180 g' },
      { name: 'Sweet potato', amount: '120 g' },
      { name: 'Asparagus', amount: '80 g' },
      { name: 'Olive oil', amount: '1 tbsp' },
      { name: 'Rosemary', amount: '1 tsp' },
    ],
  },
];

export function getMockMealById(mealId?: string) {
  if (!mealId) {
    return undefined;
  }

  return mockMeals.find((meal) => meal.id === mealId);
}