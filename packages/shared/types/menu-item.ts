import { z } from 'zod';
import { IntSchema, DateStringSchema } from './common';
import { MealTimeSchema } from './meal-template';

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
}).strict();

export const MenuItemUpdateSchema = z.object({
  portionSize: z.number().positive().optional(),
  eated: z.boolean().optional(),
}).strict().refine(
  (value) => value.portionSize !== undefined || value.eated !== undefined,
  {
    message: 'At least one updatable field is required.',
  },
);

export const MenuItemResponseSchema = MenuItemSchema.omit({ menuId: true });

export const MenuItemListSchema = z.array(MenuItemSchema);

export type DateString = z.infer<typeof DateStringSchema>;
export type MenuItem = z.infer<typeof MenuItemSchema>;
export type MenuItemCreate = z.infer<typeof MenuItemCreateSchema>;
export type MenuItemUpdate = z.infer<typeof MenuItemUpdateSchema>;
export type MenuItemResponse = z.infer<typeof MenuItemResponseSchema>;
export type MenuItemView = z.infer<typeof MenuItemSchema>;
