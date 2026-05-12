import axios from 'axios';

import {
  applyTemplateImageMutation,
  persistTemplateImageKey,
  requestTemplateImageUploadSignature,
  uploadTemplateImageToCloudinary,
} from './template-image.api';

jest.mock('@/config/runtime-config', () => ({
  normalizeOptionalString: (value?: string | null) => {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  },
  resolveExpoExtraString: jest.fn(() => null),
}));

jest.mock('axios', () => {
  return {
    __esModule: true,
    default: {
      create: jest.fn(),
      isAxiosError: jest.fn((error) => Boolean(error?.isAxiosError)),
    },
  };
});

type MockClient = {
  defaults: {
    headers: {
      common: Record<string, string>;
    };
  };
  interceptors: {
    response: {
      use: jest.Mock;
    };
  };
  patch: jest.Mock;
  post: jest.Mock;
};

describe('template-image.api', () => {
  const mockedAxios = axios as jest.Mocked<typeof axios>;
  const mockFetch = jest.fn();
  const originalFetch = global.fetch;

  function createClient(): MockClient {
    return {
      post: jest.fn(async (url: string) => {
        if (url.endsWith('/image/upload-signature')) {
          return {
            data: {
              uploadUrl: 'https://api.cloudinary.com/v1_1/kitchen-mind/image/upload',
              cloudName: 'kitchen-mind',
              apiKey: 'api-key',
              timestamp: 1234567890,
              folder: 'templates',
              publicId: 'templates/550e8400-e29b-41d4-a716-446655440001/cover',
              signature: 'signed-payload',
              resourceType: 'image',
              overwrite: true,
              invalidate: true,
              allowedFormats: ['jpg', 'jpeg', 'png'],
              maxFileSizeBytes: 5 * 1024 * 1024,
            },
          };
        }

        throw new Error(`Unhandled POST ${url}`);
      }),
      patch: jest.fn(async () => ({ data: null })),
      defaults: {
        headers: {
          common: {},
        },
      },
      interceptors: {
        response: {
          use: jest.fn(),
        },
      },
    };
  }

  beforeEach(() => {
    mockedAxios.create.mockImplementation(() => createClient() as never);
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  it('requests signed upload params for a template image', async () => {
    const client = createClient();
    mockedAxios.create.mockImplementationOnce(() => client as never);

    const result = await requestTemplateImageUploadSignature({
      accessToken: 'token-123',
      payload: {
        entityType: 'template',
        entityId: '550e8400-e29b-41d4-a716-446655440001',
        mimeType: 'image/png',
      },
      templateId: '550e8400-e29b-41d4-a716-446655440001',
    });

    expect(client.post).toHaveBeenCalledWith(
      '/v1/meal-templates/550e8400-e29b-41d4-a716-446655440001/image/upload-signature',
      {
        entityType: 'template',
        entityId: '550e8400-e29b-41d4-a716-446655440001',
        mimeType: 'image/png',
      },
    );
    expect(result.publicId).toBe('templates/550e8400-e29b-41d4-a716-446655440001/cover');
  });

  it('persists the template image key through the dedicated image endpoint', async () => {
    const client = createClient();
    mockedAxios.create.mockImplementationOnce(() => client as never);

    await persistTemplateImageKey({
      accessToken: 'token-123',
      templateId: '550e8400-e29b-41d4-a716-446655440001',
      templateImageKey: 'templates/550e8400-e29b-41d4-a716-446655440001/cover',
    });

    expect(client.patch).toHaveBeenCalledWith(
      '/v1/meal-templates/550e8400-e29b-41d4-a716-446655440001/image',
      {
        templateImageKey: 'templates/550e8400-e29b-41d4-a716-446655440001/cover',
      },
    );
  });

  it('uploads the selected template image to Cloudinary', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        public_id: 'templates/550e8400-e29b-41d4-a716-446655440001/cover',
        secure_url: 'https://res.cloudinary.com/kitchen-mind/image/upload/templates/550e8400-e29b-41d4-a716-446655440001/cover',
      }),
    });

    const result = await uploadTemplateImageToCloudinary({
      asset: {
        fileName: 'cover.png',
        fileSize: 1024,
        height: 900,
        mimeType: 'image/png',
        uri: 'file:///tmp/cover.png',
        width: 1600,
      },
      signature: {
        uploadUrl: 'https://api.cloudinary.com/v1_1/kitchen-mind/image/upload',
        cloudName: 'kitchen-mind',
        apiKey: 'api-key',
        timestamp: 1234567890,
        folder: 'templates',
        publicId: 'templates/550e8400-e29b-41d4-a716-446655440001/cover',
        signature: 'signed-payload',
        resourceType: 'image',
        overwrite: true,
        invalidate: true,
        allowedFormats: ['jpg', 'jpeg', 'png'],
        maxFileSizeBytes: 5 * 1024 * 1024,
      },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.cloudinary.com/v1_1/kitchen-mind/image/upload',
      expect.objectContaining({
        method: 'POST',
      }),
    );
    expect(result).toEqual({
      publicId: 'templates/550e8400-e29b-41d4-a716-446655440001/cover',
      secureUrl: 'https://res.cloudinary.com/kitchen-mind/image/upload/templates/550e8400-e29b-41d4-a716-446655440001/cover',
    });
  });

  it('applies a replace-image mutation by signing, uploading, and persisting the template image key', async () => {
    const client = createClient();
    mockedAxios.create.mockImplementation(() => client as never);
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        public_id: 'templates/550e8400-e29b-41d4-a716-446655440001/cover',
        secure_url: 'https://res.cloudinary.com/kitchen-mind/image/upload/templates/550e8400-e29b-41d4-a716-446655440001/cover',
      }),
    });

    await applyTemplateImageMutation({
      accessToken: 'token-123',
      mutation: {
        kind: 'replace',
        currentImageKey: null,
        asset: {
          fileName: 'cover.png',
          fileSize: 1024,
          height: 900,
          mimeType: 'image/png',
          uri: 'file:///tmp/cover.png',
          width: 1600,
        },
      },
      templateId: '550e8400-e29b-41d4-a716-446655440001',
    });

    expect(client.post).toHaveBeenCalledWith(
      '/v1/meal-templates/550e8400-e29b-41d4-a716-446655440001/image/upload-signature',
      {
        entityType: 'template',
        entityId: '550e8400-e29b-41d4-a716-446655440001',
        mimeType: 'image/png',
      },
    );
    expect(client.patch).toHaveBeenCalledWith(
      '/v1/meal-templates/550e8400-e29b-41d4-a716-446655440001/image',
      { templateImageKey: 'templates/550e8400-e29b-41d4-a716-446655440001/cover' },
    );
  });
});