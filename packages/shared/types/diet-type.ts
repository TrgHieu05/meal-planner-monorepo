import { z } from 'zod';
import { IntSchema } from './common';

export const DietTypeSchema = z.object({
  id: IntSchema,    
  name: z.string(),
  description: z.string().nullable(),
});

export const DietTypeListSchema = z.array(DietTypeSchema);

export const DietTypeResponseSchema = z.object({
  list: DietTypeListSchema,
});

export type DietType = z.infer<typeof DietTypeSchema>;
export type DietTypeList = z.infer<typeof DietTypeListSchema>;
export type DietTypeResponse = z.infer<typeof DietTypeResponseSchema>;
