import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UuidSchema } from '@meal/shared/types/common';
import { ProfileService } from './profile.service';
import { ProfileUpdateSchema } from '@meal/shared';

@ApiTags('Profile')
@Controller('v1/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('overview')
  @ApiOperation({
    summary:
      'Get full profile (user, profile info, allergies, favorite ingredients, latest metric)',
  })
  @ApiResponse({
    status: 200,
    description: 'Return the full profile of the user.',
  })
  @ApiResponse({ status: 404, description: 'User or profile not found.' })
  @ApiResponse({ status: 422, description: 'Invalid request header.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  getFullProfile(@Headers('user-id') userIdHeader: string) {
    const userId = this.parseUserId(userIdHeader);
    const profile = this.profileService.getFullProfile(userId);
    return profile;
  }

  @Get()
  @ApiOperation({ summary: 'Get only profile info' })
  @ApiResponse({
    status: 200,
    description: 'Return the profile info of the user.',
  })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  @ApiResponse({ status: 422, description: 'Invalid request header.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async getProfile(@Headers('user-id') userIdHeader: string) {
    const userId = this.parseUserId(userIdHeader);
    return this.profileService.getProfile(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update profile info' })
  @ApiResponse({
    status: 200,
    description: 'Return the updated profile info of the user.',
  })
  @ApiResponse({
    status: 404,
    description: 'User, profile, or referenced option not found.',
  })
  @ApiResponse({
    status: 422,
    description: 'Invalid request header or payload.',
  })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async updateProfile(
    @Headers('user-id') userIdHeader: string,
    @Body() body: unknown,
  ) {
    const userId = this.parseUserId(userIdHeader);
    const payload = this.parseProfileUpdate(body);
    return this.profileService.updateProfile(userId, payload);
  }

  private parseUserId(userIdHeader?: string) {
    const parsed = UuidSchema.safeParse(userIdHeader);
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        message: 'Header "user-id" must be a valid UUID.',
      });
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
}
