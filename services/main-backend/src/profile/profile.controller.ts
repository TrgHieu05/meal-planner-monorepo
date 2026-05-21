import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Req,
  UnprocessableEntityException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UuidSchema } from '@meal/shared/types/common';
import { ProfileService } from './profile.service';
import { ProfileCreateSchema, ProfileUpdateSchema } from '@meal/shared';
import { RequireAuth } from '../auth/jwt-auth.guard';

@ApiTags('Profile')
@ApiBearerAuth('JWT')
@Controller('v1/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  @RequireAuth()
  @ApiOperation({ summary: 'Create profile info for the current user for first-time onboarding' })
  @ApiResponse({
    status: 201,
    description: 'Return the created profile info of the user.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  @ApiResponse({
    status: 404,
    description: 'User or referenced option not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Profile already exists for the current user.',
  })
  @ApiResponse({
    status: 422,
    description: 'Invalid request payload.',
  })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  @ApiBody({
    description: 'Profile creation payload',
    schema: {
      type: 'object',
      required: ['dietTypeId', 'goalId', 'cuisineTypeId'],
      properties: {
        dietTypeId: { type: 'integer', minimum: 1, example: 2 },
        goalId: { type: 'integer', minimum: 1, example: 1 },
        cuisineTypeId: { type: 'integer', minimum: 1, example: 3 },
        targetCalories: {
          type: 'number',
          minimum: 0.01,
          nullable: true,
          example: 2100,
        },
        activityLevel: {
          type: 'string',
          enum: ['HIGH', 'AVERAGE', 'LOW'],
          nullable: true,
          example: 'AVERAGE',
        },
      },
      additionalProperties: false,
    },
  })
  async createProfile(
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    const userId = this.getUserIdFromRequest(request);
    const payload = this.parseProfileCreate(body);
    return this.profileService.createProfile(userId, payload);
  }

  @Get('overview')
  @RequireAuth()
  @ApiOperation({
    summary:
      'Get full profile (user, profile info, allergies, favorite ingredients, latest metric)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return the full profile of the user.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  @ApiResponse({ status: 404, description: 'User or profile not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  getFullProfile(@Req() request: AuthenticatedRequest) {
    const userId = this.getUserIdFromRequest(request);
    const profile = this.profileService.getFullProfile(userId);
    return profile;
  }

  @Get()
  @RequireAuth()
  @ApiOperation({ summary: 'Get only profile info' })
  @ApiResponse({
    status: 200,
    description: 'Return the profile info of the user.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async getProfile(@Req() request: AuthenticatedRequest) {
    const userId = this.getUserIdFromRequest(request);
    return this.profileService.getProfile(userId);
  }

  @Patch()
  @RequireAuth()
  @ApiOperation({ summary: 'Update profile info' })
  @ApiResponse({
    status: 200,
    description: 'Return the updated profile info of the user.',
  })
  @ApiResponse({
    status: 401,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  @ApiResponse({
    status: 404,
    description: 'User, profile, or referenced option not found.',
  })
  @ApiResponse({
    status: 422,
    description: 'Invalid request payload.',
  })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  @ApiBody({
    description: 'Profile update payload',
    schema: {
      type: 'object',
      properties: {
        dietTypeId: { type: 'integer', minimum: 1, example: 2 },
        goalId: { type: 'integer', minimum: 1, example: 1 },
        cuisineTypeId: { type: 'integer', minimum: 1, example: 3 },
        targetCalories: {
          type: 'number',
          minimum: 0.01,
          nullable: true,
          example: 2100,
        },
        activityLevel: {
          type: 'string',
          enum: ['HIGH', 'AVERAGE', 'LOW'],
          nullable: true,
          example: 'AVERAGE',
        },
      },
      additionalProperties: false,
    },
  })
  async updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    const userId = this.getUserIdFromRequest(request);
    const payload = this.parseProfileUpdate(body);
    return this.profileService.updateProfile(userId, payload);
  }

  private getUserIdFromRequest(request: AuthenticatedRequest) {
    const parsed = UuidSchema.safeParse(request.user?.id);
    if (!parsed.success) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
    return parsed.data;
  }

  private parseProfileUpdate(body: unknown) {
    const parsed = ProfileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        message: 'Request body is invalid for profile update.',
        details: parsed.error.flatten(),
      });
    }
    return parsed.data;
  }

  private parseProfileCreate(body: unknown) {
    const parsed = ProfileCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        message: 'Request body is invalid for profile creation.',
        details: parsed.error.flatten(),
      });
    }
    return parsed.data;
  }
}

type AuthenticatedRequest = {
  user?: {
    id?: string;
  };
};
