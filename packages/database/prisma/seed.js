/* eslint-disable no-console */
const { PrismaClient, Difficulty, MealTime } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

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

const SEED_CUISINE = {
  name: 'Seed Cuisine',
  description: 'Cuisine type used by menu seed data',
};

const SEED_INGREDIENTS = {
  rolledOats: {
    name: 'Seed Rolled Oats',
    calories: 389,
    protein: 16.9,
    fat: 6.9,
    fiber: 10.6,
    hasGluten: false,
    isVegetarian: true,
  },
  greekYogurt: {
    name: 'Seed Greek Yogurt',
    calories: 97,
    protein: 9,
    fat: 5,
    fiber: 0,
    hasGluten: false,
    isVegetarian: true,
  },
  chiaSeeds: {
    name: 'Seed Chia Seeds',
    calories: 486,
    protein: 16.5,
    fat: 30.7,
    fiber: 34.4,
    hasGluten: false,
    isVegetarian: true,
  },
  blueberry: {
    name: 'Seed Blueberry',
    calories: 57,
    protein: 0.7,
    fat: 0.3,
    fiber: 2.4,
    hasGluten: false,
    isVegetarian: true,
  },
  chickenBreast: {
    name: 'Seed Chicken Breast',
    calories: 165,
    protein: 31,
    fat: 3.6,
    fiber: 0,
    hasGluten: false,
    isVegetarian: false,
  },
  romaineLettuce: {
    name: 'Seed Romaine Lettuce',
    calories: 17,
    protein: 1.2,
    fat: 0.3,
    fiber: 2.1,
    hasGluten: false,
    isVegetarian: true,
  },
  avocado: {
    name: 'Seed Avocado',
    calories: 160,
    protein: 2,
    fat: 14.7,
    fiber: 6.7,
    hasGluten: false,
    isVegetarian: true,
  },
  tomato: {
    name: 'Seed Tomato',
    calories: 18,
    protein: 0.9,
    fat: 0.2,
    fiber: 1.2,
    hasGluten: false,
    isVegetarian: true,
  },
  salmonFillet: {
    name: 'Seed Salmon Fillet',
    calories: 208,
    protein: 20,
    fat: 13,
    fiber: 0,
    hasGluten: false,
    isVegetarian: false,
  },
  quinoaCooked: {
    name: 'Seed Quinoa Cooked',
    calories: 120,
    protein: 4.4,
    fat: 1.9,
    fiber: 2.8,
    hasGluten: false,
    isVegetarian: true,
  },
  broccoli: {
    name: 'Seed Broccoli',
    calories: 34,
    protein: 2.8,
    fat: 0.4,
    fiber: 2.6,
    hasGluten: false,
    isVegetarian: true,
  },
  oliveOil: {
    name: 'Seed Olive Oil',
    calories: 884,
    protein: 0,
    fat: 100,
    fiber: 0,
    hasGluten: false,
    isVegetarian: true,
  },
};

function toBusinessDayStartUtc(date) {
  return new Date(`${date}T00:00:00.000+07:00`);
}

function roundTo2(value) {
  return Math.round(value * 100) / 100;
}

async function ensureCuisineType(tx) {
  const existing = await tx.cuisineType.findFirst({
    where: {
      name: SEED_CUISINE.name,
    },
  });

  if (existing) {
    return tx.cuisineType.update({
      where: { id: existing.id },
      data: {
        description: SEED_CUISINE.description,
      },
    });
  }

  return tx.cuisineType.create({
    data: SEED_CUISINE,
  });
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

    const ingredients = {
      rolledOats: await ensureIngredient(tx, SEED_INGREDIENTS.rolledOats),
      greekYogurt: await ensureIngredient(tx, SEED_INGREDIENTS.greekYogurt),
      chiaSeeds: await ensureIngredient(tx, SEED_INGREDIENTS.chiaSeeds),
      blueberry: await ensureIngredient(tx, SEED_INGREDIENTS.blueberry),
      chickenBreast: await ensureIngredient(tx, SEED_INGREDIENTS.chickenBreast),
      romaineLettuce: await ensureIngredient(tx, SEED_INGREDIENTS.romaineLettuce),
      avocado: await ensureIngredient(tx, SEED_INGREDIENTS.avocado),
      tomato: await ensureIngredient(tx, SEED_INGREDIENTS.tomato),
      salmonFillet: await ensureIngredient(tx, SEED_INGREDIENTS.salmonFillet),
      quinoaCooked: await ensureIngredient(tx, SEED_INGREDIENTS.quinoaCooked),
      broccoli: await ensureIngredient(tx, SEED_INGREDIENTS.broccoli),
      oliveOil: await ensureIngredient(tx, SEED_INGREDIENTS.oliveOil),
    };

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
      { ingredientId: ingredients.salmonFillet.id, quantity: 170 },
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
