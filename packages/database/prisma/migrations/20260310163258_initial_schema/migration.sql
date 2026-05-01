-- CreateEnum
CREATE TYPE "ProviderEnum" AS ENUM ('local', 'google', 'facebook');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('high', 'average', 'low');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('1', '2', '3', '4', '5');

-- CreateEnum
CREATE TYPE "MealTime" AS ENUM ('breakfast', 'lunch', 'dinner');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "user_name" VARCHAR(50) NOT NULL,
    "gender" VARCHAR(1) NOT NULL,
    "date_of_birth" DATE,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_providers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider" "ProviderEnum" NOT NULL,
    "provider_id" TEXT NOT NULL,
    "password_hash" VARCHAR(255),
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "user_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "diet_type" BIGINT NOT NULL,
    "goal" BIGINT NOT NULL,
    "cuisine_type" BIGINT NOT NULL,
    "target_calories" DOUBLE PRECISION,
    "activity_level" "ActivityLevel",
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "height_cm" DOUBLE PRECISION NOT NULL,
    "weight_kg" DOUBLE PRECISION NOT NULL,
    "bmi" DOUBLE PRECISION NOT NULL,
    "recorded_at" TIMESTAMP NOT NULL,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "fiber" DOUBLE PRECISION NOT NULL,
    "has_gluten" BOOLEAN NOT NULL,
    "is_vegetarian" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "allergies" (
    "user_id" UUID NOT NULL,
    "ingredient_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "allergies_pkey" PRIMARY KEY ("user_id","ingredient_id")
);

-- CreateTable
CREATE TABLE "favorite_ingredients" (
    "user_id" UUID NOT NULL,
    "ingredient_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_ingredients_pkey" PRIMARY KEY ("user_id","ingredient_id")
);

-- CreateTable
CREATE TABLE "meals" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "meal_image_key" TEXT,
    "description" TEXT NOT NULL,
    "cuisine_type_id" BIGINT NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "cook_time_mins" INTEGER NOT NULL,
    "total_calories" DOUBLE PRECISION NOT NULL,
    "total_protein" DOUBLE PRECISION NOT NULL,
    "total_fat" DOUBLE PRECISION NOT NULL,
    "total_fiber" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_ingredients" (
    "id" BIGSERIAL NOT NULL,
    "meal_id" BIGINT NOT NULL,
    "ingredient_id" BIGINT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "meal_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" BIGSERIAL NOT NULL,
    "user_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "note" TEXT,
    "total_calories" DOUBLE PRECISION NOT NULL,
    "total_protein" DOUBLE PRECISION NOT NULL,
    "total_fat" DOUBLE PRECISION NOT NULL,
    "total_fiber" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_items" (
    "id" BIGSERIAL NOT NULL,
    "menu_id" BIGINT NOT NULL,
    "meal_id" BIGINT NOT NULL,
    "meal_time" "MealTime" NOT NULL,
    "eated" BOOLEAN NOT NULL,
    "portion_size" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "menu_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diet_types" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "diet_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cuisine_types" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "cuisine_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_templates" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "template_image_key" TEXT,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "meal_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_template_days" (
    "id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "day_number" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "meal_template_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_template_day_items" (
    "id" UUID NOT NULL,
    "day_id" UUID NOT NULL,
    "meal_id" BIGINT NOT NULL,
    "meal_time" "MealTime" NOT NULL,
    "portion_size" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL,

    CONSTRAINT "meal_template_day_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_name_key" ON "ingredients"("name");

-- AddForeignKey
ALTER TABLE "user_providers" ADD CONSTRAINT "user_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_diet_type_fkey" FOREIGN KEY ("diet_type") REFERENCES "diet_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_goal_fkey" FOREIGN KEY ("goal") REFERENCES "goals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_cuisine_type_fkey" FOREIGN KEY ("cuisine_type") REFERENCES "cuisine_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "allergies" ADD CONSTRAINT "allergies_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_ingredients" ADD CONSTRAINT "favorite_ingredients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite_ingredients" ADD CONSTRAINT "favorite_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meals" ADD CONSTRAINT "meals_cuisine_type_id_fkey" FOREIGN KEY ("cuisine_type_id") REFERENCES "cuisine_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_ingredients" ADD CONSTRAINT "meal_ingredients_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_ingredients" ADD CONSTRAINT "meal_ingredients_ingredient_id_fkey" FOREIGN KEY ("ingredient_id") REFERENCES "ingredients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_templates" ADD CONSTRAINT "meal_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_template_days" ADD CONSTRAINT "meal_template_days_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "meal_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_template_day_items" ADD CONSTRAINT "meal_template_day_items_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "meal_template_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_template_day_items" ADD CONSTRAINT "meal_template_day_items_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
