import { z } from 'zod';
import { DateStringSchema, IntSchema, UuidSchema } from './common';
import { MenuItemListSchema } from './menu-item';

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

export const MenuMealsByTimeSchema = z.object({
  BREAKFAST: MenuItemListSchema,
  LUNCH: MenuItemListSchema,
  DINNER: MenuItemListSchema,
});

export const MenuResponseSchema = z.object({
  date: DateStringSchema,
  hasMenu: z.boolean(),
  nutritionTotal: MenuNutritionTotalSchema,
  meals: MenuMealsByTimeSchema,
});

export type Menu = z.infer<typeof MenuSchema>;
export type MenuNutritionTotal = z.infer<typeof MenuNutritionTotalSchema>;
export type MenuMealsByTime = z.infer<typeof MenuMealsByTimeSchema>;
export type MenuResponse = z.infer<typeof MenuResponseSchema>;
