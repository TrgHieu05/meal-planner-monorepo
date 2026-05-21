/*
  Warnings:

  - A unique constraint covering the columns `[template_id,day_number]` on the table `meal_template_days` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "meal_template_days_template_id_day_number_key" ON "meal_template_days"("template_id", "day_number");
