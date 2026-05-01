/*
  Warnings:

  - The primary key for the `allergies` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `ingredient_id` on the `allergies` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `cuisine_types` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `cuisine_types` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `diet_types` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `diet_types` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `favorite_ingredients` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `ingredient_id` on the `favorite_ingredients` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `goals` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `goals` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `ingredients` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `ingredients` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `meal_ingredients` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `meal_ingredients` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `meal_id` on the `meal_ingredients` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `ingredient_id` on the `meal_ingredients` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `meal_id` on the `meal_template_day_items` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `meals` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `meals` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `cuisine_type_id` on the `meals` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `menu_items` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `menu_items` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `menu_id` on the `menu_items` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `meal_id` on the `menu_items` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `menus` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `menus` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - The primary key for the `metrics` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `metrics` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `diet_type` on the `profiles` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `goal` on the `profiles` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `cuisine_type` on the `profiles` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- DropForeignKey
ALTER TABLE "allergies" DROP CONSTRAINT "allergies_ingredient_id_fkey";

-- DropForeignKey
ALTER TABLE "favorite_ingredients" DROP CONSTRAINT "favorite_ingredients_ingredient_id_fkey";

-- DropForeignKey
ALTER TABLE "meal_ingredients" DROP CONSTRAINT "meal_ingredients_ingredient_id_fkey";

-- DropForeignKey
ALTER TABLE "meal_ingredients" DROP CONSTRAINT "meal_ingredients_meal_id_fkey";

-- DropForeignKey
ALTER TABLE "meal_template_day_items" DROP CONSTRAINT "meal_template_day_items_meal_id_fkey";

-- DropForeignKey
ALTER TABLE "meals" DROP CONSTRAINT "meals_cuisine_type_id_fkey";

-- DropForeignKey
ALTER TABLE "menu_items" DROP CONSTRAINT "menu_items_meal_id_fkey";

-- DropForeignKey
ALTER TABLE "menu_items" DROP CONSTRAINT "menu_items_menu_id_fkey";

-- DropForeignKey
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_cuisine_type_fkey";

-- DropForeignKey
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_diet_type_fkey";

-- DropForeignKey
ALTER TABLE "profiles" DROP CONSTRAINT "profiles_goal_fkey";

-- AlterTable
ALTER TABLE "allergies" DROP CONSTRAINT "allergies_pkey",
ALTER COLUMN "ingredient_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "allergies_pkey" PRIMARY KEY ("user_id", "ingredient_id");

-- AlterTable
ALTER TABLE "cuisine_types" DROP CONSTRAINT "cuisine_types_pkey",
ALTER COLUMN "id" SET DATA TYPE INT,
ADD CONSTRAINT "cuisine_types_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "diet_types" DROP CONSTRAINT "diet_types_pkey",
ALTER COLUMN "id" SET DATA TYPE INT,
ADD CONSTRAINT "diet_types_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "favorite_ingredients" DROP CONSTRAINT "favorite_ingredients_pkey",
ALTER COLUMN "ingredient_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "favorite_ingredients_pkey" PRIMARY KEY ("user_id", "ingredient_id");

-- AlterTable
ALTER TABLE "goals" DROP CONSTRAINT "goals_pkey",
ALTER COLUMN "id" SET DATA TYPE INT,
ADD CONSTRAINT "goals_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ingredients" DROP CONSTRAINT "ingredients_pkey",
ALTER COLUMN "id" SET DATA TYPE INT,
ADD CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "meal_ingredients" DROP CONSTRAINT "meal_ingredients_pkey",
ALTER COLUMN "id" SET DATA TYPE INT,
ALTER COLUMN "meal_id" SET DATA TYPE INTEGER,
ALTER COLUMN "ingredient_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "meal_ingredients_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "meal_template_day_items" ALTER COLUMN "meal_id" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "meals" DROP CONSTRAINT "meals_pkey",
ALTER COLUMN "id" SET DATA TYPE INT,
ALTER COLUMN "cuisine_type_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "meals_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "menu_items" DROP CONSTRAINT "menu_items_pkey",
ALTER COLUMN "id" SET DATA TYPE INT,
ALTER COLUMN "menu_id" SET DATA TYPE INTEGER,
ALTER COLUMN "meal_id" SET DATA TYPE INTEGER,
ADD CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "menus" DROP CONSTRAINT "menus_pkey",
ALTER COLUMN "id" SET DATA TYPE INT,
ADD CONSTRAINT "menus_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "metrics" DROP CONSTRAINT "metrics_pkey",
ALTER COLUMN "id" SET DATA TYPE INT,
ADD CONSTRAINT "metrics_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "profiles" ALTER COLUMN "diet_type" SET DATA TYPE INTEGER,
ALTER COLUMN "goal" SET DATA TYPE INTEGER,
ALTER COLUMN "cuisine_type" SET DATA TYPE INTEGER;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_diet_type_fkey" FOREIGN KEY ("diet_type") REFERENCES "diet_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_goal_fkey" FOREIGN KEY ("goal") REFERENCES "goals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_cuisine_type_fkey" FOREIGN KEY ("cuisine_type") REFERENCES "cuisine_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_ingredients" ADD CONSTRAINT "favorite_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meals" ADD CONSTRAINT "meals_cuisine_type_id_fkey" FOREIGN KEY ("cuisine_type_id") REFERENCES "cuisine_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_ingredients" ADD CONSTRAINT "meal_ingredients_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_ingredients" ADD CONSTRAINT "meal_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_template_day_items" ADD CONSTRAINT "meal_template_day_items_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
