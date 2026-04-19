import { z } from 'zod';
import { IntSchema } from './common';

export const GoalSchema = z.object({
  id: IntSchema,
  name: z.string(),
  description: z.string().nullable(),
});

export const GoalListSchema = z.array(GoalSchema);

export const GoalResponseSchema = z.object({
  list: GoalListSchema,
});

export type Goal = z.infer<typeof GoalSchema>;
export type GoalList = z.infer<typeof GoalListSchema>;
export type GoalResponse = z.infer<typeof GoalResponseSchema>;


