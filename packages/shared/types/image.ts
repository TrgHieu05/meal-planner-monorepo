import { z } from 'zod';

export const ImagePublicIdSchema = z.string().min(1).max(255);
export type ImagePublicId = z.infer<typeof ImagePublicIdSchema>;

export const ImageVariantUrlsSchema = z.object({
  card: z.string().url(),
  detail: z.string().url(),
  original: z.string().url(),
});
export type ImageVariantUrls = z.infer<typeof ImageVariantUrlsSchema>;

export const ImageUploadFormatSchema = z.enum(['jpg', 'jpeg', 'png']);
export type ImageUploadFormat = z.infer<typeof ImageUploadFormatSchema>;

export const ImageUploadMimeTypeSchema = z.enum(['image/jpeg', 'image/jpg', 'image/png']);
export type ImageUploadMimeType = z.infer<typeof ImageUploadMimeTypeSchema>;

export const ImageEntityTypeSchema = z.enum(['meal', 'template']);
export type ImageEntityType = z.infer<typeof ImageEntityTypeSchema>;

export const CreateImageUploadSignatureRequestSchema = z.object({
  entityType: ImageEntityTypeSchema,
  entityId: z.string().min(1).max(255),
  mimeType: ImageUploadMimeTypeSchema,
});
export type CreateImageUploadSignatureRequest = z.infer<typeof CreateImageUploadSignatureRequestSchema>;

export const CreateImageUploadSignatureResponseSchema = z.object({
  uploadUrl: z.string().url(),
  cloudName: z.string().min(1),
  apiKey: z.string().min(1),
  timestamp: z.number().int().positive(),
  folder: z.string().min(1),
  publicId: ImagePublicIdSchema,
  signature: z.string().min(1),
  resourceType: z.literal('image'),
  overwrite: z.boolean(),
  invalidate: z.boolean(),
  allowedFormats: z.array(ImageUploadFormatSchema).min(1),
  maxFileSizeBytes: z.number().int().positive(),
});
export type CreateImageUploadSignatureResponse = z.infer<typeof CreateImageUploadSignatureResponseSchema>;