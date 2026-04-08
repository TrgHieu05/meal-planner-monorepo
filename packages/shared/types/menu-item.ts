import { z } from 'zod';
import { IntSchema, DateStringSchema } from './common';

export const MealTimeSchema = z.enum(['BREAKFAST', 'LUNCH', 'DINNER']);

export const MenuItemSchema = z.object({
  id: IntSchema,
  menuId: IntSchema,
  mealId: IntSchema,
  mealTime: MealTimeSchema,
  eated: z.boolean(),
  portionSize: z.number().positive(),
});

export const MenuItemCreateSchema = z.object({
  date: DateStringSchema,
  mealId: IntSchema,
  mealTime: MealTimeSchema,
  portionSize: z.number().positive(),
});

export const MenuItemUpdateSchema = z.object({
  portionSize: z.number().positive().optional(),
  eated: z.boolean().optional(),
})

export const MenuItemResponseSchema = MenuItemSchema.omit({ menuId: true });

export const MenuItemListSchema = z.array(MenuItemSchema);

export type DateString = z.infer<typeof DateStringSchema>;
export type MealTime = z.infer<typeof MealTimeSchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;
export type MenuItemCreate = z.infer<typeof MenuItemCreateSchema>;
export type MenuItemUpdate = z.infer<typeof MenuItemUpdateSchema>;
export type MenuItemResponse = z.infer<typeof MenuItemResponseSchema>;
export type MenuItemView = z.infer<typeof MenuItemSchema>;
