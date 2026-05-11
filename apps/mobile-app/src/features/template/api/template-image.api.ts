import { z } from 'zod';

import {
  CreateImageUploadSignatureRequestSchema,
  CreateImageUploadSignatureResponseSchema,
  UpdateMealTemplateImageRequestSchema,
  type CreateImageUploadSignatureRequest,
  type CreateImageUploadSignatureResponse,
  type ImageUploadMimeType,
} from '@meal/shared';

import { createAuthenticatedApiClient } from '@/services/api/http-client';

const TemplateIdSchema = z.string().uuid();

const CloudinaryUploadResponseSchema = z.object({
  public_id: z.string().min(1),
  secure_url: z.string().url(),
  version: z.union([z.string(), z.number()]).optional(),
});

export type TemplateSelectedImageAsset = {
  fileName: string | null;
  fileSize: number | null;
  height: number;
  mimeType: ImageUploadMimeType;
  uri: string;
  width: number;
};

export type TemplateImageMutation =
  | {
      kind: 'keep';
      currentImageKey: string | null;
    }
  | {
      kind: 'remove';
      currentImageKey: string;
    }
  | {
      kind: 'replace';
      asset: TemplateSelectedImageAsset;
      currentImageKey: string | null;
    };

type AuthenticatedTemplateImageApiConfig = {
  accessToken: string;
  apiBaseUrl?: string;
  templateId: string;
};

export async function applyTemplateImageMutation(
  config: AuthenticatedTemplateImageApiConfig & {
    mutation: TemplateImageMutation;
  },
): Promise<void> {
  switch (config.mutation.kind) {
    case 'keep':
      return;
    case 'remove':
      await persistTemplateImageKey({
        accessToken: config.accessToken,
        apiBaseUrl: config.apiBaseUrl,
        templateId: config.templateId,
        templateImageKey: null,
      });
      return;
    case 'replace': {
      const signature = await requestTemplateImageUploadSignature({
        accessToken: config.accessToken,
        apiBaseUrl: config.apiBaseUrl,
        payload: buildTemplateImageUploadSignatureRequest(
          config.templateId,
          config.mutation.asset.mimeType,
        ),
        templateId: config.templateId,
      });
      const uploadResult = await uploadTemplateImageToCloudinary({
        asset: config.mutation.asset,
        signature,
      });

      await persistTemplateImageKey({
        accessToken: config.accessToken,
        apiBaseUrl: config.apiBaseUrl,
        templateId: config.templateId,
        templateImageKey: uploadResult.publicId,
      });
      return;
    }
  }
}

export async function requestTemplateImageUploadSignature(
  config: AuthenticatedTemplateImageApiConfig & {
    payload: CreateImageUploadSignatureRequest;
  },
): Promise<CreateImageUploadSignatureResponse> {
  const client = createProtectedTemplateImageApiClient(config);
  const templateId = parseWithSchema(TemplateIdSchema, config.templateId, {
    userMessage: 'Unable to prepare the template image upload right now.',
    failureMode: 'request',
  });
  const payload = parseWithSchema(CreateImageUploadSignatureRequestSchema, config.payload, {
    userMessage: 'Unable to prepare the template image upload right now.',
    failureMode: 'request',
  });

  const response = await client.post(
    `/v1/meal-templates/${templateId}/image/upload-signature`,
    payload,
  );

  return parseWithSchema(CreateImageUploadSignatureResponseSchema, response.data, {
    userMessage: 'Unable to prepare the template image upload right now.',
  });
}

export async function persistTemplateImageKey(
  config: AuthenticatedTemplateImageApiConfig & {
    templateImageKey: string | null;
  },
): Promise<void> {
  const client = createProtectedTemplateImageApiClient(config);
  const templateId = parseWithSchema(TemplateIdSchema, config.templateId, {
    userMessage: 'Unable to save the template image right now.',
    failureMode: 'request',
  });
  const payload = parseWithSchema(
    UpdateMealTemplateImageRequestSchema,
    { templateImageKey: config.templateImageKey },
    {
      userMessage: 'Unable to save the template image right now.',
      failureMode: 'request',
    },
  );

  await client.patch(`/v1/meal-templates/${templateId}/image`, payload);
}

export async function uploadTemplateImageToCloudinary(config: {
  asset: TemplateSelectedImageAsset;
  signature: CreateImageUploadSignatureResponse;
}): Promise<{
  publicId: string;
  secureUrl: string;
}> {
  const { asset, signature } = config;

  if (asset.fileSize != null && asset.fileSize > signature.maxFileSizeBytes) {
    throw new Error('Selected image must be 5 MB or smaller.');
  }

  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    name: asset.fileName ?? buildDefaultImageFileName(asset.mimeType),
    type: asset.mimeType,
  } as any);
  formData.append('api_key', signature.apiKey);
  formData.append('timestamp', `${signature.timestamp}`);
  formData.append('folder', signature.folder);
  formData.append('public_id', signature.publicId);
  formData.append('signature', signature.signature);
  formData.append('overwrite', `${signature.overwrite}`);
  formData.append('invalidate', `${signature.invalidate}`);
  formData.append('allowed_formats', signature.allowedFormats.join(','));

  const response = await fetch(signature.uploadUrl, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error('Unable to upload the template image right now.');
  }

  const parsed = CloudinaryUploadResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error('Unable to upload the template image right now.');
  }

  return {
    publicId: parsed.data.public_id,
    secureUrl: parsed.data.secure_url,
  };
}

function buildTemplateImageUploadSignatureRequest(
  templateId: string,
  mimeType: ImageUploadMimeType,
): CreateImageUploadSignatureRequest {
  return parseWithSchema(
    CreateImageUploadSignatureRequestSchema,
    {
      entityType: 'template',
      entityId: templateId,
      mimeType,
    },
    {
      userMessage: 'Unable to prepare the template image upload right now.',
      failureMode: 'request',
    },
  );
}

function buildDefaultImageFileName(mimeType: ImageUploadMimeType) {
  switch (mimeType) {
    case 'image/png':
      return 'template-cover.png';
    case 'image/jpg':
      return 'template-cover.jpg';
    case 'image/jpeg':
      return 'template-cover.jpeg';
  }
}

function createProtectedTemplateImageApiClient(config: {
  accessToken: string;
  apiBaseUrl?: string;
}) {
  return createAuthenticatedApiClient({
    apiBaseUrl: config.apiBaseUrl,
    accessToken: config.accessToken,
  });
}

function parseWithSchema<T>(
  schema: z.ZodType<T>,
  payload: unknown,
  config: {
    userMessage: string;
    failureMode?: 'request' | 'response';
  },
): T {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(config.userMessage);
  }

  return parsed.data;
}