import { z } from 'zod';
import { IntSchema, UuidSchema } from './common';

export const MetricSchema = z.object({
  id: IntSchema,
  userId: UuidSchema,
  heightCm: z.number().positive(),
  weightKg: z.number().positive(),
  bmi: z.number().positive(),
  recordedAt: z.date(),
});

export const MetricCreateSchema = z.object({
  heightCm: z.number().positive(),
  weightKg: z.number().positive(),
});

export const MetricResponseSchema = MetricSchema.omit({ userId: true });
export const MetricCreateResponseSchema = MetricResponseSchema;
export const LatestMetricResponseSchema = MetricResponseSchema.nullable();

export type Metric = z.infer<typeof MetricSchema>;
export type MetricCreate = z.infer<typeof MetricCreateSchema>;
export type MetricResponse = z.infer<typeof MetricResponseSchema>;
export type MetricCreateResponse = z.infer<typeof MetricCreateResponseSchema>;
export type LatestMetricResponse = z.infer<typeof LatestMetricResponseSchema>;
