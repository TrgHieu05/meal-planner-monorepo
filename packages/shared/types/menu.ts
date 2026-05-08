import { z } from 'zod';
import { DateStringSchema, IntSchema, UuidSchema } from './common';

export const MenuSchema = z.object({
  id: IntSchema,
  userId: UuidSchema,
  date: z.date(),
  note: z.string().nullable().optional(),
  totalCalories: z.number().nonnegative(),
  totalProtein: z.number().nonnegative(),
  totalFat: z.number().nonnegative(),
  totalFiber: z.number().nonnegative(),
});

export const MenuNutritionTotalSchema = z.object({
  calories: z.number().nonnegative(),
  protein: z.number().nonnegative(),
  fat: z.number().nonnegative(),
  fiber: z.number().nonnegative(),
});

export const MenuDayMealItemSchema = z.object({
  menuItemId: IntSchema,
  mealId: IntSchema,
  mealName: z.string().min(1),
  portionSize: z.number().positive(),
  eated: z.boolean(),
  nutritionPerServing: MenuNutritionTotalSchema,
});

export const MenuDayMealItemListSchema = z.array(MenuDayMealItemSchema);

export const MenuMealsByTimeSchema = z.object({
  BREAKFAST: MenuDayMealItemListSchema,
  LUNCH: MenuDayMealItemListSchema,
  DINNER: MenuDayMealItemListSchema,
});

export const MenuResponseSchema = z.object({
  date: DateStringSchema,
  hasMenu: z.boolean(),
  nutritionTotal: MenuNutritionTotalSchema,
  meals: MenuMealsByTimeSchema,
});

export type Menu = z.infer<typeof MenuSchema>;
export type MenuNutritionTotal = z.infer<typeof MenuNutritionTotalSchema>;
export type MenuDayMealItem = z.infer<typeof MenuDayMealItemSchema>;
export type MenuMealsByTime = z.infer<typeof MenuMealsByTimeSchema>;
export type MenuResponse = z.infer<typeof MenuResponseSchema>;
