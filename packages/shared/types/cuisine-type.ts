import { z } from 'zod';
import { IntSchema } from './common';

export const CuisineTypeSchema = z.object({
  id: IntSchema,
  name: z.string(),
  description: z.string().nullable(),
});

export const CuisineTypeListSchema = z.array(CuisineTypeSchema);

export const CuisineTypeResponseSchema = z.object({
  list: CuisineTypeListSchema,
});

export type CuisineType = z.infer<typeof CuisineTypeSchema>;
export type CuisineTypeList = z.infer<typeof CuisineTypeListSchema>;
export type CuisineTypeResponse = z.infer<typeof CuisineTypeResponseSchema>;
