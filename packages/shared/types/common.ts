import { z } from 'zod';

export const UuidSchema = z.uuid();
export const IntSchema = z.number().int().positive();

export type Uuid = z.infer<typeof UuidSchema>;
export type Int = z.infer<typeof IntSchema>;
