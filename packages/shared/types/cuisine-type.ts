import { z } from 'zod';
import { IntSchema } from './common';

export const CuisineTypeSchema = z.object({
  id: IntSchema,
  name: z.string(),
  description: z.string().nullable(),
});

export const CuisineTypeResponseSchema = z.object({
  list: z.array(CuisineTypeSchema),
});

export type CuisineType = z.infer<typeof CuisineTypeSchema>;
export type CuisineTypeResponse = z.infer<typeof CuisineTypeResponseSchema>;
