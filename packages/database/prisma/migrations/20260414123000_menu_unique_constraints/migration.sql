-- Enforce one menu per user per business day
CREATE UNIQUE INDEX "menus_user_id_date_key" ON "menus"("user_id", "date");

-- Enforce one meal per meal-time inside the same menu
CREATE UNIQUE INDEX "menu_items_menu_id_meal_id_meal_time_key" ON "menu_items"("menu_id", "meal_id", "meal_time");
