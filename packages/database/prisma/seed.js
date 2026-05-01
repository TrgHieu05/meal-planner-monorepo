/* eslint-disable no-console */
const { PrismaClient, Difficulty, MealTime } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const ingredientCatalogSeed = require('./ingredient.seed');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run seed.');
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const SEED_USER = {
  email: 'menu.seed@meal.local',
  userName: 'Menu Seed User',
  gender: 'M',
  dateOfBirth: new Date('1998-01-15T00:00:00.000Z'),
};

const SEED_DIET_TYPES = [
  {
    name: 'Balanced',
    description: 'A varied eating pattern that combines lean protein, whole grains, fruits, and vegetables.',
  },
  {
    name: 'Vegetarian',
    description: 'Plant-forward meals that may include dairy and eggs while excluding meat and seafood.',
  },
  {
    name: 'High Protein',
    description: 'Meals designed to increase protein intake while keeping carbs and fats balanced.',
  },
];

const SEED_GOALS = [
  {
    name: 'Weight Loss',
    description: 'Supports a calorie deficit with satisfying meals that emphasize nutrient density.',
  },
  {
    name: 'Maintenance',
    description: 'Keeps energy intake stable for users focused on maintaining their current weight.',
  },
  {
    name: 'Muscle Gain',
    description: 'Prioritizes higher protein intake and sufficient calories to support lean mass growth.',
  },
];

const SEED_CUISINE_TYPES = [
  {
    name: 'Mediterranean',
    description: 'Olive oil, vegetables, legumes, seafood, and whole grains inspired by coastal Mediterranean cooking.',
  },
  {
    name: 'Japanese',
    description: 'Light, balanced dishes centered on rice, fish, soy, seaweed, and seasonal vegetables.',
  },
  {
    name: 'Vietnamese',
    description: 'Fresh herbs, broths, rice noodles, and bright sweet-sour-salty flavors from Vietnamese cuisine.',
  },
  {
    name: 'Korean',
    description: 'Savory meals with fermented ingredients, rice, vegetables, and grilled proteins.',
  },
  {
    name: 'Indian',
    description: 'Spice-forward dishes built around legumes, vegetables, grains, and slow-cooked proteins.',
  },
  {
    name: 'Mexican',
    description: 'Meals featuring beans, corn, chiles, herbs, and grilled meats or vegetables.',
  },
];

const MENU_SEED_CUISINE_NAME = 'Mediterranean';

function toBusinessDayStartUtc(date) {
  return new Date(`${date}T00:00:00.000+07:00`);
}

function roundTo2(value) {
  return Math.round(value * 100) / 100;
}

async function ensureCuisineType(tx) {
  const existing = await tx.cuisineType.findFirst({
    where: {
      name: MENU_SEED_CUISINE_NAME,
    },
  });

  if (existing) {
    return tx.cuisineType.update({
      where: { id: existing.id },
      data: {
        description:
          SEED_CUISINE_TYPES.find((item) => item.name === MENU_SEED_CUISINE_NAME)
            ?.description ?? existing.description,
      },
    });
  }

  return tx.cuisineType.create({
    data:
      SEED_CUISINE_TYPES.find((item) => item.name === MENU_SEED_CUISINE_NAME) ?? {
        name: MENU_SEED_CUISINE_NAME,
        description: null,
      },
  });
}

async function ensureNamedOption(delegate, optionInput) {
  const existing = await delegate.findFirst({
    where: {
      name: optionInput.name,
    },
  });

  if (existing) {
    return delegate.update({
      where: { id: existing.id },
      data: {
        description: optionInput.description,
      },
    });
  }

  return delegate.create({
    data: optionInput,
  });
}

async function seedNamedOptions(delegate, optionSeed) {
  const seededOptions = [];

  for (const optionInput of optionSeed) {
    const seededOption = await ensureNamedOption(delegate, optionInput);
    seededOptions.push(seededOption);
  }

  return seededOptions;
}

async function ensureMeal(tx, mealInput) {
  const existing = await tx.meal.findFirst({
    where: {
      name: mealInput.name,
      cuisineTypeId: mealInput.cuisineTypeId,
    },
  });

  if (existing) {
    return tx.meal.update({
      where: { id: existing.id },
      data: {
        description: mealInput.description,
        difficulty: mealInput.difficulty,
        cookTimeMins: mealInput.cookTimeMins,
        totalCalories: mealInput.totalCalories,
        totalProtein: mealInput.totalProtein,
        totalFat: mealInput.totalFat,
        totalFiber: mealInput.totalFiber,
      },
    });
  }

  return tx.meal.create({
    data: mealInput,
  });
}

async function ensureIngredient(tx, ingredientInput) {
  const existing = await tx.ingredient.findFirst({
    where: {
      name: ingredientInput.name,
    },
  });

  if (existing) {
    return tx.ingredient.update({
      where: { id: existing.id },
      data: {
        calories: ingredientInput.calories,
        protein: ingredientInput.protein,
        fat: ingredientInput.fat,
        fiber: ingredientInput.fiber,
        hasGluten: ingredientInput.hasGluten,
        isVegetarian: ingredientInput.isVegetarian,
      },
    });
  }

  return tx.ingredient.create({
    data: ingredientInput,
  });
}

async function seedIngredientCatalog(tx) {
  const ingredientIds = [];
  const ingredientsByName = new Map();

  for (const ingredient of ingredientCatalogSeed) {
    const seededIngredient = await ensureIngredient(tx, ingredient);
    ingredientIds.push(seededIngredient.id);
    ingredientsByName.set(seededIngredient.name, seededIngredient);
  }

  return {
    ingredientIds,
    ingredientsByName,
  };
}

function getRequiredMealIngredients(ingredientsByName) {
  const requiredIngredients = {
    rolledOats: 'Rolled Oats',
    greekYogurt: 'Greek Yogurt Plain',
    chiaSeeds: 'Chia Seeds',
    blueberry: 'Blueberry',
    chickenBreast: 'Chicken Breast',
    romaineLettuce: 'Romaine Lettuce',
    avocado: 'Avocado',
    tomato: 'Tomato',
    salmon: 'Salmon',
    quinoaCooked: 'Quinoa Cooked',
    broccoli: 'Broccoli',
    oliveOil: 'Olive Oil',
  };

  return Object.fromEntries(
    Object.entries(requiredIngredients).map(([key, ingredientName]) => {
      const ingredient = ingredientsByName.get(ingredientName);

      if (!ingredient) {
        throw new Error(`Required ingredient not found in ingredient.seed.js: ${ingredientName}`);
      }

      return [key, ingredient];
    }),
  );
}

async function replaceMealIngredients(tx, mealId, items) {
  await tx.mealIngredient.deleteMany({
    where: {
      mealId,
    },
  });

  if (items.length > 0) {
    await tx.mealIngredient.createMany({
      data: items.map((item) => ({
        mealId,
        ingredientId: item.ingredientId,
        quantity: item.quantity,
      })),
    });
  }
}

async function upsertMenuWithItems(tx, input) {
  const date = toBusinessDayStartUtc(input.date);

  let menu = await tx.menu.findFirst({
    where: {
      userId: input.userId,
      date,
    },
    select: {
      id: true,
    },
  });

  if (!menu) {
    menu = await tx.menu.create({
      data: {
        userId: input.userId,
        date,
        note: input.note,
        totalCalories: 0,
        totalProtein: 0,
        totalFat: 0,
        totalFiber: 0,
      },
      select: {
        id: true,
      },
    });
  } else {
    await tx.menu.update({
      where: { id: menu.id },
      data: {
        note: input.note,
      },
    });
  }

  await tx.menuItem.deleteMany({
    where: {
      menuId: menu.id,
    },
  });

  if (input.items.length > 0) {
    await tx.menuItem.createMany({
      data: input.items.map((item) => ({
        menuId: menu.id,
        mealId: item.mealId,
        mealTime: item.mealTime,
        portionSize: item.portionSize,
        eated: item.eated,
      })),
    });
  }

  const persistedItems = await tx.menuItem.findMany({
    where: {
      menuId: menu.id,
    },
    include: {
      meal: {
        select: {
          totalCalories: true,
          totalProtein: true,
          totalFat: true,
          totalFiber: true,
        },
      },
    },
  });

  const totals = persistedItems.reduce(
    (acc, item) => {
      acc.calories += item.meal.totalCalories * item.portionSize;
      acc.protein += item.meal.totalProtein * item.portionSize;
      acc.fat += item.meal.totalFat * item.portionSize;
      acc.fiber += item.meal.totalFiber * item.portionSize;
      return acc;
    },
    { calories: 0, protein: 0, fat: 0, fiber: 0 },
  );

  await tx.menu.update({
    where: { id: menu.id },
    data: {
      totalCalories: roundTo2(totals.calories),
      totalProtein: roundTo2(totals.protein),
      totalFat: roundTo2(totals.fat),
      totalFiber: roundTo2(totals.fiber),
    },
  });

  return menu.id;
}

async function seedMenuFeatureData() {
  return prisma.$transaction(async (tx) => {
    const { ingredientIds: catalogIngredientIds, ingredientsByName } =
      await seedIngredientCatalog(tx);
    const seededDietTypes = await seedNamedOptions(tx.dietType, SEED_DIET_TYPES);
    const seededGoals = await seedNamedOptions(tx.goal, SEED_GOALS);
    const seededCuisineTypes = await seedNamedOptions(
      tx.cuisineType,
      SEED_CUISINE_TYPES,
    );

    const user = await tx.user.upsert({
      where: {
        email: SEED_USER.email,
      },
      update: {
        userName: SEED_USER.userName,
        gender: SEED_USER.gender,
        dateOfBirth: SEED_USER.dateOfBirth,
      },
      create: SEED_USER,
    });

    const cuisineType = await ensureCuisineType(tx);

    const breakfastMeal = await ensureMeal(tx, {
      name: 'Seed Overnight Oats',
      description: 'High-fiber overnight oats for breakfast testing',
      cuisineTypeId: cuisineType.id,
      difficulty: Difficulty.LEVEL_1,
      cookTimeMins: 10,
      totalCalories: 320,
      totalProtein: 14,
      totalFat: 9,
      totalFiber: 8,
    });

    const lunchMeal = await ensureMeal(tx, {
      name: 'Seed Chicken Salad Bowl',
      description: 'Balanced lunch bowl with lean protein and greens',
      cuisineTypeId: cuisineType.id,
      difficulty: Difficulty.LEVEL_2,
      cookTimeMins: 20,
      totalCalories: 480,
      totalProtein: 36,
      totalFat: 18,
      totalFiber: 10,
    });

    const dinnerMeal = await ensureMeal(tx, {
      name: 'Seed Salmon Quinoa Plate',
      description: 'Omega-rich salmon with quinoa and vegetables',
      cuisineTypeId: cuisineType.id,
      difficulty: Difficulty.LEVEL_3,
      cookTimeMins: 30,
      totalCalories: 560,
      totalProtein: 40,
      totalFat: 22,
      totalFiber: 7,
    });

    const ingredients = getRequiredMealIngredients(ingredientsByName);

    await replaceMealIngredients(tx, breakfastMeal.id, [
      { ingredientId: ingredients.rolledOats.id, quantity: 60 },
      { ingredientId: ingredients.greekYogurt.id, quantity: 120 },
      { ingredientId: ingredients.chiaSeeds.id, quantity: 15 },
      { ingredientId: ingredients.blueberry.id, quantity: 80 },
    ]);

    await replaceMealIngredients(tx, lunchMeal.id, [
      { ingredientId: ingredients.chickenBreast.id, quantity: 180 },
      { ingredientId: ingredients.romaineLettuce.id, quantity: 90 },
      { ingredientId: ingredients.avocado.id, quantity: 70 },
      { ingredientId: ingredients.tomato.id, quantity: 80 },
      { ingredientId: ingredients.oliveOil.id, quantity: 12 },
    ]);

    await replaceMealIngredients(tx, dinnerMeal.id, [
      { ingredientId: ingredients.salmon.id, quantity: 170 },
      { ingredientId: ingredients.quinoaCooked.id, quantity: 150 },
      { ingredientId: ingredients.broccoli.id, quantity: 120 },
      { ingredientId: ingredients.oliveOil.id, quantity: 10 },
    ]);

    const menuOneId = await upsertMenuWithItems(tx, {
      userId: user.id,
      date: '2026-03-24',
      note: 'Seeded menu - day 1',
      items: [
        {
          mealId: breakfastMeal.id,
          mealTime: MealTime.BREAKFAST,
          portionSize: 1,
          eated: false,
        },
        {
          mealId: lunchMeal.id,
          mealTime: MealTime.LUNCH,
          portionSize: 1.25,
          eated: true,
        },
        {
          mealId: dinnerMeal.id,
          mealTime: MealTime.DINNER,
          portionSize: 1,
          eated: false,
        },
      ],
    });

    const menuTwoId = await upsertMenuWithItems(tx, {
      userId: user.id,
      date: '2026-03-25',
      note: 'Seeded menu - day 2',
      items: [
        {
          mealId: breakfastMeal.id,
          mealTime: MealTime.BREAKFAST,
          portionSize: 0.8,
          eated: false,
        },
        {
          mealId: dinnerMeal.id,
          mealTime: MealTime.DINNER,
          portionSize: 1.1,
          eated: false,
        },
      ],
    });

    return {
      userId: user.id,
      menuIds: [menuOneId, menuTwoId],
      mealIds: [breakfastMeal.id, lunchMeal.id, dinnerMeal.id],
      ingredientIds: Object.values(ingredients).map((ingredient) => ingredient.id),
      catalogIngredientCount: catalogIngredientIds.length,
      dietTypeCount: seededDietTypes.length,
      goalCount: seededGoals.length,
      cuisineTypeCount: seededCuisineTypes.length,
      cuisineTypeId: cuisineType.id,
    };
  });
}

async function main() {
  const result = await seedMenuFeatureData();

  const seededMenus = await prisma.menu.findMany({
    where: {
      id: {
        in: result.menuIds,
      },
    },
    include: {
      items: {
        include: {
          meal: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  const seededMeals = await prisma.meal.findMany({
    where: {
      id: {
        in: result.mealIds,
      },
    },
    include: {
      ingredients: {
        include: {
          ingredient: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
      },
    },
    orderBy: {
      id: 'asc',
    },
  });

  console.log('Seed completed successfully.');
  console.log(`User: ${SEED_USER.email} (${result.userId})`);
  console.log(`CuisineType ID: ${result.cuisineTypeId}`);
  console.log(`Catalog ingredients seeded: ${result.catalogIngredientCount}`);
  console.log(`Diet types seeded: ${result.dietTypeCount}`);
  console.log(`Goals seeded: ${result.goalCount}`);
  console.log(`Cuisine types seeded: ${result.cuisineTypeCount}`);
  console.log(`Meal IDs: ${result.mealIds.join(', ')}`);
  console.log(`Ingredient IDs: ${result.ingredientIds.join(', ')}`);

  for (const meal of seededMeals) {
    console.log(`\nMeal ${meal.id} - ${meal.name}:`);
    for (const mealIngredient of meal.ingredients) {
      console.log(
        `- ${mealIngredient.ingredient.name} | quantity=${mealIngredient.quantity}`,
      );
    }
  }

  for (const menu of seededMenus) {
    const date = menu.date.toISOString().slice(0, 10);
    console.log(`\nMenu ${menu.id} on ${date}:`);
    for (const item of menu.items) {
      console.log(
        `- [${item.mealTime}] ${item.meal.name} | portion=${item.portionSize} | eated=${item.eated}`,
      );
    }
    console.log(
      `  Totals: kcal=${menu.totalCalories}, protein=${menu.totalProtein}, fat=${menu.totalFat}, fiber=${menu.totalFiber}`,
    );
  }
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
