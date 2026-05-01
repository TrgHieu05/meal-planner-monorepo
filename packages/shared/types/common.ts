import { z } from 'zod';

export const UuidSchema = z.uuid();

export const IntSchema = z.number().int().positive();

export const DateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export type Uuid = z.infer<typeof UuidSchema>;
export type Int = z.infer<typeof IntSchema>;
