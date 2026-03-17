import { z } from 'zod';

export const UuidSchema = z.uuid();
export const IntSchema = z.number().int().positive();
