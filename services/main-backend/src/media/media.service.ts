import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  type CreateImageUploadSignatureRequest,
  type CreateImageUploadSignatureResponse,
  type ImageEntityType,
  type ImageVariantUrls,
} from '@meal/shared';
import { v2 as cloudinary } from 'cloudinary';

type ImageVariant = keyof ImageVariantUrls;

type CloudinaryTransformation = {
  crop?: string;
  gravity?: string;
  width?: number;
  height?: number;
  fetch_format?: string;
  quality?: string;
  dpr?: string;
};

@Injectable()
export class MediaService {
  private readonly allowedFormats = ['jpg', 'jpeg', 'png'] as const;

  private readonly maxFileSizeBytes = 5 * 1024 * 1024;

  private readonly transformations: Record<
    ImageEntityType,
    Record<'card' | 'detail', CloudinaryTransformation>
  > = {
    meal: {
      card: {
        crop: 'fill',
        gravity: 'center',
        width: 240,
        height: 240,
        fetch_format: 'auto',
        quality: 'auto',
        dpr: 'auto',
      },
      detail: {
        crop: 'fill',
        gravity: 'center',
        width: 1080,
        height: 1080,
        fetch_format: 'auto',
        quality: 'auto:good',
        dpr: 'auto',
      },
    },
    template: {
      card: {
        crop: 'fill',
        gravity: 'center',
        width: 640,
        height: 360,
        fetch_format: 'auto',
        quality: 'auto',
        dpr: 'auto',
      },
      detail: {
        crop: 'fill',
        gravity: 'center',
        width: 1600,
        height: 900,
        fetch_format: 'auto',
        quality: 'auto:good',
        dpr: 'auto',
      },
    },
  };

  constructor(private readonly configService: ConfigService) {}

  buildImageUrls(
    entityType: ImageEntityType,
    publicId: string | null,
  ): ImageVariantUrls | null {
    if (!publicId) {
      return null;
    }

    const normalizedPublicId = this.normalizePublicId(publicId);
    this.configureCloudinary();

    return {
      card: this.buildVariantUrl(entityType, normalizedPublicId, 'card'),
      detail: this.buildVariantUrl(entityType, normalizedPublicId, 'detail'),
      original: cloudinary.url(normalizedPublicId, {
        secure: true,
      }),
    };
  }

  createUploadSignature(
    input: CreateImageUploadSignatureRequest,
  ): CreateImageUploadSignatureResponse {
    this.configureCloudinary();

    const cloudName = this.getRequiredConfig('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.getRequiredConfig('CLOUDINARY_API_KEY');
    const apiSecret = this.getRequiredConfig('CLOUDINARY_API_SECRET');

    this.getFormatForMimeType(input.mimeType);

    const folder = this.getFolder(input.entityType);
    const publicId = this.buildPublicId(input.entityType, input.entityId);
    const timestamp = Math.floor(Date.now() / 1000);
    const overwrite = true;
    const invalidate = true;

    const paramsToSign = {
      timestamp,
      folder,
      public_id: publicId,
      overwrite,
      invalidate,
      allowed_formats: this.allowedFormats.join(','),
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      apiSecret,
    );

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      cloudName,
      apiKey,
      timestamp,
      folder,
      publicId,
      signature,
      resourceType: 'image',
      overwrite,
      invalidate,
      allowedFormats: [...this.allowedFormats],
      maxFileSizeBytes: this.maxFileSizeBytes,
    };
  }

  buildPublicId(entityType: ImageEntityType, entityId: string) {
    const normalizedEntityId = this.normalizeEntityId(entityId);
    return `${this.getFolder(entityType)}/${normalizedEntityId}/cover`;
  }

  private buildVariantUrl(
    entityType: ImageEntityType,
    publicId: string,
    variant: ImageVariant,
  ) {
    if (variant === 'original') {
      return cloudinary.url(publicId, {
        secure: true,
      });
    }

    return cloudinary.url(publicId, {
      secure: true,
      ...this.transformations[entityType][variant],
    });
  }

  private configureCloudinary() {
    cloudinary.config({
      cloud_name: this.getRequiredConfig('CLOUDINARY_CLOUD_NAME'),
      api_key: this.getRequiredConfig('CLOUDINARY_API_KEY'),
      api_secret: this.getRequiredConfig('CLOUDINARY_API_SECRET'),
      secure: true,
      signature_algorithm: 'sha256',
    });
  }

  private getFolder(entityType: ImageEntityType) {
    switch (entityType) {
      case 'meal':
        return 'meals';
      case 'template':
        return 'templates';
    }
  }

  private getRequiredConfig(key: string) {
    const value = this.configService.get<string>(key)?.trim();

    if (!value) {
      throw new InternalServerErrorException(`${key} is not configured.`);
    }

    return value;
  }

  private getFormatForMimeType(mimeType: CreateImageUploadSignatureRequest['mimeType']) {
    switch (mimeType) {
      case 'image/jpeg':
      case 'image/jpg':
        return 'jpg';
      case 'image/png':
        return 'png';
    }
  }

  private normalizeEntityId(entityId: string) {
    const normalizedEntityId = entityId.trim();

    if (!/^[A-Za-z0-9_-]+$/.test(normalizedEntityId)) {
      throw new BadRequestException('Invalid entityId.');
    }

    return normalizedEntityId;
  }

  private normalizePublicId(publicId: string) {
    const normalizedPublicId = publicId.trim();

    if (!/^[A-Za-z0-9/_-]+$/.test(normalizedPublicId)) {
      throw new BadRequestException('Invalid image public ID.');
    }

    return normalizedPublicId;
  }
}