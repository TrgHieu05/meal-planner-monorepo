import * as dotenv from 'dotenv';
import path from 'path';
import { Client } from 'pg';

dotenv.config({
  path: path.resolve(process.cwd(), '../../.env'),
});

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const ingredientsData = [
  { "name": "Chicken Breast", "calories": 165, "protein": 31, "fat": 3.6, "fiber": 0, "has_gluten": false, "is_vegetarian": false },
  { "name": "Beef", "calories": 250, "protein": 26, "fat": 15, "fiber": 0, "has_gluten": false, "is_vegetarian": false },
  { "name": "Salmon", "calories": 208, "protein": 20, "fat": 13, "fiber": 0, "has_gluten": false, "is_vegetarian": false },
  { "name": "Egg", "calories": 155, "protein": 13, "fat": 11, "fiber": 0, "has_gluten": false, "is_vegetarian": true },
  { "name": "Rice", "calories": 130, "protein": 2.7, "fat": 0.3, "fiber": 0.4, "has_gluten": false, "is_vegetarian": true },
  { "name": "Pasta", "calories": 131, "protein": 5, "fat": 1.1, "fiber": 1.8, "has_gluten": true, "is_vegetarian": true },
  { "name": "Bread", "calories": 265, "protein": 9, "fat": 3.2, "fiber": 2.7, "has_gluten": true, "is_vegetarian": true },
  { "name": "Potato", "calories": 77, "protein": 2, "fat": 0.1, "fiber": 2.2, "has_gluten": false, "is_vegetarian": true },
  { "name": "Tomato", "calories": 18, "protein": 0.9, "fat": 0.2, "fiber": 1.2, "has_gluten": false, "is_vegetarian": true },
  { "name": "Cucumber", "calories": 16, "protein": 0.7, "fat": 0.1, "fiber": 0.5, "has_gluten": false, "is_vegetarian": true },
  { "name": "Onion", "calories": 40, "protein": 1.1, "fat": 0.1, "fiber": 1.7, "has_gluten": false, "is_vegetarian": true },
  { "name": "Garlic", "calories": 149, "protein": 6.4, "fat": 0.5, "fiber": 2.1, "has_gluten": false, "is_vegetarian": true },
  { "name": "Milk", "calories": 42, "protein": 3.4, "fat": 1, "fiber": 0, "has_gluten": false, "is_vegetarian": true },
  { "name": "Cheese", "calories": 402, "protein": 25, "fat": 33, "fiber": 0, "has_gluten": false, "is_vegetarian": true },
  { "name": "Butter", "calories": 717, "protein": 0.9, "fat": 81, "fiber": 0, "has_gluten": false, "is_vegetarian": true },
  { "name": "Olive Oil", "calories": 884, "protein": 0, "fat": 100, "fiber": 0, "has_gluten": false, "is_vegetarian": true },
  { "name": "Carrot", "calories": 41, "protein": 0.9, "fat": 0.2, "fiber": 2.8, "has_gluten": false, "is_vegetarian": true },
  { "name": "Broccoli", "calories": 55, "protein": 3.7, "fat": 0.6, "fiber": 2.6, "has_gluten": false, "is_vegetarian": true },
  { "name": "Mushroom", "calories": 22, "protein": 3.1, "fat": 0.3, "fiber": 1, "has_gluten": false, "is_vegetarian": true },
  { "name": "Shrimp", "calories": 99, "protein": 24, "fat": 0.3, "fiber": 0, "has_gluten": false, "is_vegetarian": false }
];

const mealsData = [
  { "name": "Grilled Chicken Rice", "difficulty": "1", "cook_time_mins": 20, "description": "A simple and healthy chicken and rice meal.", "total_calories": 295, "total_protein": 33.7, "total_fat": 3.9, "total_fiber": 0.4, "ingredients": ["Chicken Breast", "Rice", "Garlic", "Olive Oil"] },
  { "name": "Chicken Fried Rice", "difficulty": "2", "cook_time_mins": 25, "description": "Classic fried rice with chicken and veggies.", "total_calories": 531, "total_protein": 48.7, "total_fat": 15.0, "total_fiber": 4.9, "ingredients": ["Chicken Breast", "Rice", "Egg", "Carrot", "Onion"] },
  { "name": "Chicken Pasta", "difficulty": "1", "cook_time_mins": 20, "description": "Quick pasta tossed with chicken and garlic.", "total_calories": 296, "total_protein": 36, "total_fat": 4.7, "total_fiber": 1.8, "ingredients": ["Chicken Breast", "Pasta", "Olive Oil", "Garlic"] },
  { "name": "Chicken Sandwich", "difficulty": "1", "cook_time_mins": 10, "description": "Fresh chicken sandwich with cheese.", "total_calories": 850, "total_protein": 65.9, "total_fat": 39.8, "total_fiber": 3.9, "ingredients": ["Chicken Breast", "Bread", "Tomato", "Cheese"] },
  { "name": "Chicken Salad", "difficulty": "1", "cook_time_mins": 15, "description": "Refreshing chicken salad with olive oil dressing.", "total_calories": 199, "total_protein": 32.6, "total_fat": 3.9, "total_fiber": 1.7, "ingredients": ["Chicken Breast", "Tomato", "Cucumber", "Olive Oil"] },
  { "name": "Chicken Soup", "difficulty": "2", "cook_time_mins": 35, "description": "Warm and comforting chicken soup.", "total_calories": 246, "total_protein": 33, "total_fat": 3.9, "total_fiber": 4.5, "ingredients": ["Chicken Breast", "Carrot", "Onion"] },
  { "name": "Garlic Chicken", "difficulty": "1", "cook_time_mins": 20, "description": "Aromatic garlic chicken cooked in butter.", "total_calories": 1031, "total_protein": 38.3, "total_fat": 85.1, "total_fiber": 2.1, "ingredients": ["Chicken Breast", "Garlic", "Butter"] },
  { "name": "Cheese Chicken", "difficulty": "2", "cook_time_mins": 25, "description": "Cheesy and buttery chicken breast.", "total_calories": 1284, "total_protein": 56.9, "total_fat": 117.6, "total_fiber": 0, "ingredients": ["Chicken Breast", "Cheese", "Butter"] },
  { "name": "Chicken Burger", "difficulty": "3", "cook_time_mins": 20, "description": "Juicy chicken burger with fresh tomato.", "total_calories": 850, "total_protein": 65.9, "total_fat": 39.8, "total_fiber": 3.9, "ingredients": ["Chicken Breast", "Bread", "Cheese", "Tomato"] },
  { "name": "Chicken Wrap", "difficulty": "1", "cook_time_mins": 10, "description": "Quick chicken wrap with cucumber.", "total_calories": 446, "total_protein": 40.7, "total_fat": 6.9, "total_fiber": 3.2, "ingredients": ["Chicken Breast", "Bread", "Cucumber", "Tomato"] },
  { "name": "Beef Rice Bowl", "difficulty": "1", "cook_time_mins": 25, "description": "Hearty beef served over rice with onions.", "total_calories": 420, "total_protein": 29.8, "total_fat": 15.4, "total_fiber": 2.1, "ingredients": ["Beef", "Rice", "Onion"] },
  { "name": "Beef Fried Rice", "difficulty": "2", "cook_time_mins": 30, "description": "Savory fried rice mixed with beef and egg.", "total_calories": 576, "total_protein": 42.6, "total_fat": 26.5, "total_fiber": 3.2, "ingredients": ["Beef", "Rice", "Egg", "Carrot"] },
  { "name": "Beef Pasta", "difficulty": "2", "cook_time_mins": 25, "description": "Classic beef pasta with tomato sauce.", "total_calories": 399, "total_protein": 31.9, "total_fat": 16.3, "total_fiber": 3.0, "ingredients": ["Beef", "Pasta", "Tomato"] },
  { "name": "Beef Sandwich", "difficulty": "1", "cook_time_mins": 15, "description": "Filling beef sandwich with melted cheese.", "total_calories": 917, "total_protein": 60, "total_fat": 51.2, "total_fiber": 2.7, "ingredients": ["Beef", "Bread", "Cheese"] },
  { "name": "Beef Salad", "difficulty": "1", "cook_time_mins": 15, "description": "High-protein beef salad with fresh veggies.", "total_calories": 284, "total_protein": 27.6, "total_fat": 15.3, "total_fiber": 1.7, "ingredients": ["Beef", "Tomato", "Cucumber"] },
  { "name": "Beef Soup", "difficulty": "3", "cook_time_mins": 45, "description": "Slow-cooked beef and vegetable soup.", "total_calories": 331, "total_protein": 28, "total_fat": 15.3, "total_fiber": 4.5, "ingredients": ["Beef", "Carrot", "Onion"] },
  { "name": "Beef Steak", "difficulty": "3", "cook_time_mins": 20, "description": "Pan-seared beef steak with garlic butter.", "total_calories": 1116, "total_protein": 33.3, "total_fat": 96.5, "total_fiber": 2.1, "ingredients": ["Beef", "Butter", "Garlic"] },
  { "name": "Butter Beef", "difficulty": "2", "cook_time_mins": 15, "description": "Rich and buttery beef bites.", "total_calories": 967, "total_protein": 26.9, "total_fat": 96, "total_fiber": 0, "ingredients": ["Beef", "Butter"] },
  { "name": "Beef Burger", "difficulty": "2", "cook_time_mins": 20, "description": "Homemade beef burger with cheese.", "total_calories": 935, "total_protein": 60.9, "total_fat": 51.4, "total_fiber": 3.9, "ingredients": ["Beef", "Bread", "Cheese", "Tomato"] },
  { "name": "Beef Wrap", "difficulty": "1", "cook_time_mins": 10, "description": "Beef slices wrapped with fresh cucumber.", "total_calories": 531, "total_protein": 35.7, "total_fat": 18.3, "total_fiber": 3.2, "ingredients": ["Beef", "Bread", "Cucumber"] },
  { "name": "Salmon Rice Bowl", "difficulty": "1", "cook_time_mins": 20, "description": "Healthy salmon and rice bowl.", "total_calories": 338, "total_protein": 22.7, "total_fat": 13.3, "total_fiber": 0.4, "ingredients": ["Salmon", "Rice"] },
  { "name": "Salmon Salad", "difficulty": "1", "cook_time_mins": 10, "description": "Light salmon salad for a quick meal.", "total_calories": 242, "total_protein": 21.6, "total_fat": 13.3, "total_fiber": 1.7, "ingredients": ["Salmon", "Tomato", "Cucumber"] },
  { "name": "Grilled Salmon", "difficulty": "2", "cook_time_mins": 20, "description": "Garlic infused grilled salmon.", "total_calories": 357, "total_protein": 26.4, "total_fat": 13.5, "total_fiber": 2.1, "ingredients": ["Salmon", "Garlic", "Olive Oil"] },
  { "name": "Salmon Pasta", "difficulty": "3", "cook_time_mins": 25, "description": "Creamy butter salmon pasta.", "total_calories": 1056, "total_protein": 25.9, "total_fat": 95.1, "total_fiber": 1.8, "ingredients": ["Salmon", "Pasta", "Butter"] },
  { "name": "Salmon Sandwich", "difficulty": "1", "cook_time_mins": 15, "description": "Delicious salmon and cheese sandwich.", "total_calories": 875, "total_protein": 54, "total_fat": 49.2, "total_fiber": 2.7, "ingredients": ["Salmon", "Bread", "Cheese"] },
  { "name": "Garlic Shrimp", "difficulty": "2", "cook_time_mins": 15, "description": "Shrimp sautéed in garlic butter.", "total_calories": 965, "total_protein": 31.3, "total_fat": 81.8, "total_fiber": 2.1, "ingredients": ["Shrimp", "Garlic", "Butter"] },
  { "name": "Shrimp Fried Rice", "difficulty": "2", "cook_time_mins": 25, "description": "Classic shrimp fried rice.", "total_calories": 384, "total_protein": 39.7, "total_fat": 11.6, "total_fiber": 0.4, "ingredients": ["Shrimp", "Rice", "Egg"] },
  { "name": "Shrimp Pasta", "difficulty": "2", "cook_time_mins": 20, "description": "Simple olive oil shrimp pasta.", "total_calories": 230, "total_protein": 29, "total_fat": 1.4, "total_fiber": 1.8, "ingredients": ["Shrimp", "Pasta", "Olive Oil"] },
  { "name": "Shrimp Salad", "difficulty": "1", "cook_time_mins": 10, "description": "Fresh shrimp salad bowl.", "total_calories": 133, "total_protein": 25.6, "total_fat": 0.6, "total_fiber": 1.7, "ingredients": ["Shrimp", "Tomato", "Cucumber"] },
  { "name": "Shrimp Soup", "difficulty": "2", "cook_time_mins": 25, "description": "Warm carrot and shrimp soup.", "total_calories": 140, "total_protein": 24.9, "total_fat": 0.5, "total_fiber": 2.8, "ingredients": ["Shrimp", "Carrot"] },
  { "name": "Omelette Cheese", "difficulty": "1", "cook_time_mins": 10, "description": "Fluffy cheese omelette.", "total_calories": 599, "total_protein": 41.4, "total_fat": 45, "total_fiber": 0, "ingredients": ["Egg", "Cheese", "Milk"] },
  { "name": "Omelette Mushroom", "difficulty": "1", "cook_time_mins": 10, "description": "Egg omelette stuffed with mushrooms.", "total_calories": 177, "total_protein": 16.1, "total_fat": 11.3, "total_fiber": 1.0, "ingredients": ["Egg", "Mushroom"] },
  { "name": "Omelette Tomato", "difficulty": "1", "cook_time_mins": 10, "description": "Fresh tomato omelette.", "total_calories": 173, "total_protein": 13.9, "total_fat": 11.2, "total_fiber": 1.2, "ingredients": ["Egg", "Tomato"] },
  { "name": "Egg Sandwich", "difficulty": "1", "cook_time_mins": 10, "description": "Quick egg sandwich for breakfast.", "total_calories": 420, "total_protein": 22, "total_fat": 14.2, "total_fiber": 2.7, "ingredients": ["Egg", "Bread"] },
  { "name": "Egg Salad", "difficulty": "1", "cook_time_mins": 10, "description": "Simple boiled egg and cucumber salad.", "total_calories": 171, "total_protein": 13.7, "total_fat": 11.1, "total_fiber": 0.5, "ingredients": ["Egg", "Cucumber"] },
  { "name": "Vegetable Pasta", "difficulty": "1", "cook_time_mins": 20, "description": "Healthy veggie pasta mix.", "total_calories": 227, "total_protein": 9.6, "total_fat": 1.9, "total_fiber": 7.2, "ingredients": ["Pasta", "Broccoli", "Carrot"] },
  { "name": "Vegetable Soup", "difficulty": "1", "cook_time_mins": 30, "description": "Clear vegetable broth.", "total_calories": 136, "total_protein": 5.7, "total_fat": 0.9, "total_fiber": 7.1, "ingredients": ["Carrot", "Broccoli", "Onion"] },
  { "name": "Mushroom Soup", "difficulty": "1", "cook_time_mins": 20, "description": "Creamy mushroom milk soup.", "total_calories": 64, "total_protein": 6.5, "total_fat": 1.3, "total_fiber": 1.0, "ingredients": ["Mushroom", "Milk"] },
  { "name": "Vegetable Salad", "difficulty": "1", "cook_time_mins": 10, "description": "Fresh raw vegetable mix.", "total_calories": 75, "total_protein": 2.5, "total_fat": 0.5, "total_fiber": 4.5, "ingredients": ["Tomato", "Cucumber", "Carrot"] },
  { "name": "Healthy Veggie Bowl", "difficulty": "1", "cook_time_mins": 15, "description": "Steamed broccoli, carrot and cucumber.", "total_calories": 112, "total_protein": 5.3, "total_fat": 0.9, "total_fiber": 5.9, "ingredients": ["Broccoli", "Carrot", "Cucumber"] },
  { "name": "Chicken Curry", "difficulty": "3", "cook_time_mins": 40, "description": "Creamy chicken curry with milk.", "total_calories": 356, "total_protein": 40.8, "total_fat": 5.1, "total_fiber": 2.1, "ingredients": ["Chicken Breast", "Milk", "Garlic"] },
  { "name": "Beef Curry", "difficulty": "3", "cook_time_mins": 45, "description": "Slow-cooked beef curry.", "total_calories": 332, "total_protein": 30.5, "total_fat": 16.1, "total_fiber": 1.7, "ingredients": ["Beef", "Milk", "Onion"] },
  { "name": "Shrimp Curry", "difficulty": "2", "cook_time_mins": 25, "description": "Quick and creamy shrimp curry.", "total_calories": 141, "total_protein": 27.4, "total_fat": 1.3, "total_fiber": 0, "ingredients": ["Shrimp", "Milk"] },
  { "name": "Chicken Stir Fry", "difficulty": "2", "cook_time_mins": 20, "description": "Stir-fried chicken and veggies.", "total_calories": 261, "total_protein": 35.6, "total_fat": 4.4, "total_fiber": 5.4, "ingredients": ["Chicken Breast", "Broccoli", "Carrot"] },
  { "name": "Beef Stir Fry", "difficulty": "2", "cook_time_mins": 25, "description": "Beef strips stir-fried with broccoli.", "total_calories": 345, "total_protein": 30.8, "total_fat": 15.7, "total_fiber": 4.3, "ingredients": ["Beef", "Broccoli", "Onion"] },
  { "name": "Shrimp Stir Fry", "difficulty": "1", "cook_time_mins": 15, "description": "Shrimp and broccoli quick fry.", "total_calories": 154, "total_protein": 27.7, "total_fat": 0.9, "total_fiber": 2.6, "ingredients": ["Shrimp", "Broccoli"] },
  { "name": "Creamy Pasta", "difficulty": "2", "cook_time_mins": 20, "description": "Pasta with rich cheese and milk sauce.", "total_calories": 575, "total_protein": 33.4, "total_fat": 35.1, "total_fiber": 1.8, "ingredients": ["Pasta", "Milk", "Cheese"] },
  { "name": "Butter Rice", "difficulty": "1", "cook_time_mins": 15, "description": "Simple rice mixed with butter.", "total_calories": 847, "total_protein": 3.6, "total_fat": 81.3, "total_fiber": 0.4, "ingredients": ["Rice", "Butter"] },
  { "name": "Garlic Bread", "difficulty": "1", "cook_time_mins": 10, "description": "Toasted bread with garlic butter.", "total_calories": 1131, "total_protein": 16.3, "total_fat": 84.7, "total_fiber": 4.8, "ingredients": ["Bread", "Garlic", "Butter"] }
];

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    console.log('Start seeding data...');
    await client.query('BEGIN');

    const cuisineRes = await client.query<{ id: number }>(
      `SELECT id FROM cuisine_types WHERE name = $1 ORDER BY id ASC LIMIT 1`,
      ['General'],
    );

    let cuisineTypeId: number;
    if (cuisineRes.rows[0]) {
      cuisineTypeId = cuisineRes.rows[0].id;
    } else {
      const inserted = await client.query<{ id: number }>(
        `INSERT INTO cuisine_types (name, description, created_at, updated_at)
         VALUES ($1, $2, NOW(), NOW())
         RETURNING id`,
        ['General', 'General cuisine type'],
      );
      cuisineTypeId = inserted.rows[0].id;
    }

    console.log('Seeding Ingredients...');
    const ingredientNames = ingredientsData.map(i => i.name);
    await client.query(
      `INSERT INTO ingredients (name, calories, protein, fat, fiber, has_gluten, is_vegetarian, created_at, updated_at)
       SELECT
         t.name,
         t.calories,
         t.protein,
         t.fat,
         t.fiber,
         t.has_gluten,
         t.is_vegetarian,
         NOW(),
         NOW()
       FROM UNNEST(
         $1::text[],
         $2::float8[],
         $3::float8[],
         $4::float8[],
         $5::float8[],
         $6::boolean[],
         $7::boolean[]
       ) AS t(name, calories, protein, fat, fiber, has_gluten, is_vegetarian)
       ON CONFLICT (name) DO NOTHING`,
      [
        ingredientNames,
        ingredientsData.map(i => i.calories),
        ingredientsData.map(i => i.protein),
        ingredientsData.map(i => i.fat),
        ingredientsData.map(i => i.fiber),
        ingredientsData.map(i => i.has_gluten),
        ingredientsData.map(i => i.is_vegetarian),
      ],
    );

    const ingRows = await client.query<{ id: number; name: string }>(
      `SELECT id, name FROM ingredients WHERE name = ANY($1::text[])`,
      [ingredientNames],
    );
    const ingredientMap = new Map<string, number>(ingRows.rows.map(r => [r.name, r.id]));

    console.log('Seeding Meals...');
    const mealNames = mealsData.map(m => m.name);
    const existingMealsRes = await client.query<{ id: number; name: string }>(
      `SELECT id, name FROM meals WHERE name = ANY($1::text[])`,
      [mealNames],
    );
    const existingMealNames = new Set(existingMealsRes.rows.map(r => r.name));
    const mealsToInsert = mealsData.filter(m => !existingMealNames.has(m.name));

    if (mealsToInsert.length > 0) {
      await client.query(
        `INSERT INTO meals (
          name,
          description,
          cuisine_type_id,
          difficulty,
          cook_time_mins,
          total_calories,
          total_protein,
          total_fat,
          total_fiber,
          created_at,
          updated_at
        )
        SELECT
          t.name,
          t.description,
          t.cuisine_type_id,
          (t.difficulty)::"Difficulty",
          t.cook_time_mins,
          t.total_calories,
          t.total_protein,
          t.total_fat,
          t.total_fiber,
          NOW(),
          NOW()
        FROM UNNEST(
          $1::text[],
          $2::text[],
          $3::int[],
          $4::text[],
          $5::int[],
          $6::float8[],
          $7::float8[],
          $8::float8[],
          $9::float8[]
        ) AS t(
          name,
          description,
          cuisine_type_id,
          difficulty,
          cook_time_mins,
          total_calories,
          total_protein,
          total_fat,
          total_fiber
        )`,
        [
          mealsToInsert.map(m => m.name),
          mealsToInsert.map(m => m.description),
          mealsToInsert.map(() => cuisineTypeId),
          mealsToInsert.map(m => m.difficulty),
          mealsToInsert.map(m => m.cook_time_mins),
          mealsToInsert.map(m => m.total_calories),
          mealsToInsert.map(m => m.total_protein),
          mealsToInsert.map(m => m.total_fat),
          mealsToInsert.map(m => m.total_fiber),
        ],
      );
    }

    const mealRows = await client.query<{ id: number; name: string }>(
      `SELECT id, name FROM meals WHERE name = ANY($1::text[])`,
      [mealNames],
    );
    const mealMap = new Map<string, number>(mealRows.rows.map(r => [r.name, r.id]));

    console.log('Seeding Meal Ingredients...');
    const miMealIds: number[] = [];
    const miIngredientIds: number[] = [];
    const miQuantities: number[] = [];

    for (const meal of mealsData) {
      const mealId = mealMap.get(meal.name);
      if (!mealId) continue;
      for (const ingName of meal.ingredients) {
        const ingredientId = ingredientMap.get(ingName);
        if (!ingredientId) continue;
        miMealIds.push(mealId);
        miIngredientIds.push(ingredientId);
        miQuantities.push(1);
      }
    }

    if (miMealIds.length > 0) {
      await client.query(
        `INSERT INTO meal_ingredients (meal_id, ingredient_id, quantity)
         SELECT t.meal_id, t.ingredient_id, t.quantity
         FROM UNNEST($1::int[], $2::int[], $3::float8[]) AS t(meal_id, ingredient_id, quantity)
         WHERE NOT EXISTS (
           SELECT 1 FROM meal_ingredients mi
           WHERE mi.meal_id = t.meal_id AND mi.ingredient_id = t.ingredient_id
         )`,
        [miMealIds, miIngredientIds, miQuantities],
      );
    }

    await client.query('COMMIT');
    console.log('Seeding finished successfully.');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
