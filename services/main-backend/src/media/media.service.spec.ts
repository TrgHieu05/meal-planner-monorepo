import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { MediaService } from './media.service';

const configValues: Record<string, string> = {
  CLOUDINARY_CLOUD_NAME: 'kitchen-mind-test',
  CLOUDINARY_API_KEY: 'test-api-key',
  CLOUDINARY_API_SECRET: 'test-api-secret',
};

const mockConfigService = {
  get: jest.fn<string | undefined, [string]>((key: string) => configValues[key]),
};

describe('MediaService', () => {
  let service: MediaService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns null image urls when publicId is null', () => {
    expect(service.buildImageUrls('meal', null)).toBeNull();
  });

  it('builds meal card/detail/original image urls from one public id', () => {
    const urls = service.buildImageUrls('meal', 'meals/42/cover');

    expect(urls).toMatchObject({
      card: expect.stringContaining('/image/upload/'),
      detail: expect.stringContaining('/image/upload/'),
      original: expect.stringContaining('/image/upload/'),
    });
    expect(urls?.card).toContain('c_fill');
    expect(urls?.card).toContain('g_center');
    expect(urls?.card).toContain('h_240');
    expect(urls?.card).toContain('w_240');
    expect(urls?.card).toContain('/meals/42/cover');
    expect(urls?.detail).toContain('h_1080');
    expect(urls?.detail).toContain('w_1080');
    expect(urls?.original).toContain('/meals/42/cover');
  });

  it('builds template detail image urls with the 16:9 transformation', () => {
    const urls = service.buildImageUrls('template', 'templates/template-1/cover');

    expect(urls?.detail).toContain('c_fill');
    expect(urls?.detail).toContain('g_center');
    expect(urls?.detail).toContain('h_900');
    expect(urls?.detail).toContain('w_1600');
    expect(urls?.detail).toContain('/templates/template-1/cover');
  });

  it('creates signed upload parameters for direct template upload', () => {
    const signature = service.createUploadSignature({
      entityType: 'template',
      entityId: 'template-1',
      mimeType: 'image/png',
    });

    expect(signature.uploadUrl).toBe(
      'https://api.cloudinary.com/v1_1/kitchen-mind-test/image/upload',
    );
    expect(signature.folder).toBe('templates');
    expect(signature.publicId).toBe('templates/template-1/cover');
    expect(signature.allowedFormats).toEqual(['jpg', 'jpeg', 'png']);
    expect(signature.maxFileSizeBytes).toBe(5 * 1024 * 1024);
    expect(signature.overwrite).toBe(true);
    expect(signature.invalidate).toBe(true);
    expect(signature.signature).toMatch(/^[a-f0-9]{64}$/);
  });

  it('deletes a Cloudinary image asset and ignores missing assets', async () => {
    const destroySpy = jest
      .spyOn(cloudinary.uploader, 'destroy')
      .mockResolvedValueOnce({ result: 'ok' } as never)
      .mockResolvedValueOnce({ result: 'not found' } as never);

    await expect(service.deleteImage('templates/template-1/cover')).resolves.toBeUndefined();
    await expect(service.deleteImage('templates/template-2/cover')).resolves.toBeUndefined();

    expect(destroySpy).toHaveBeenNthCalledWith(1, 'templates/template-1/cover', {
      invalidate: true,
      resource_type: 'image',
    });
    expect(destroySpy).toHaveBeenNthCalledWith(2, 'templates/template-2/cover', {
      invalidate: true,
      resource_type: 'image',
    });
  });

  it('rejects invalid entity ids for public id generation', () => {
    expect(() =>
      service.buildPublicId('template', 'template/1'),
    ).toThrow(BadRequestException);
  });

  it('throws when required Cloudinary config is missing', () => {
    mockConfigService.get.mockImplementation((key: string) =>
      key === 'CLOUDINARY_API_SECRET' ? undefined : configValues[key],
    );

    expect(() =>
      service.createUploadSignature({
        entityType: 'meal',
        entityId: '42',
        mimeType: 'image/jpeg',
      }),
    ).toThrow(InternalServerErrorException);
  });
});