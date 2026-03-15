import { z } from 'zod';
import { IntSchema } from './common';

export const DietTypeSchema = z.object({
  id: IntSchema,    
  name: z.string(),
  description: z.string().nullable(),
});

export const DietTypeResponseSchema = z.object({
  list: z.array(DietTypeSchema),
});

export type DietType = z.infer<typeof DietTypeSchema>;
export type DietTypeResponse = z.infer<typeof DietTypeResponseSchema>;
