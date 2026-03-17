import { z } from 'zod';
import { IntSchema } from './common';

export const GoalSchema = z.object({
  id: IntSchema,
  name: z.string(),
  description: z.string().nullable(),
});

export const GoalResponseSchema = z.object({
  list: z.array(GoalSchema),
});

export type Goal = z.infer<typeof GoalSchema>;
export type GoalResponse = z.infer<typeof GoalResponseSchema>;


