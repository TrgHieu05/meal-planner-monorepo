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
import { ProfileUpdate, ProfileUpdateSchema } from '@meal/shared';

@ApiTags('Profile')
@Controller('v1/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get full profile (user, profile info, allergies, favorite ingredients, latest metric)' })
  @ApiResponse({ status: 200, description: 'Return the full profile of the user.' })
  getFullProfile(@Headers('user-id') userIdHeader: string) {
    const userId = this.parseUserId(userIdHeader);
    const profile = this.profileService.getFullProfile(userId);
    return profile;
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get only profile info' })
  @ApiResponse({ status: 200, description: 'Return the profile info of the user.' })
  async getProfile(@Headers('user-id') userIdHeader: string) {
    const userId = this.parseUserId(userIdHeader);
    return this.profileService.getProfile(userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update profile info' })
  @ApiResponse({ status: 200, description: 'Return the updated profile info of the user.' })
  async updateProfile(@Headers('user-id') userIdHeader: string, @Body() body: unknown) {
    const userId = this.parseUserId(userIdHeader);
    const payload = this.parseProfileUpdate(body);
    return this.profileService.updateProfile(userId, payload);
  }

  private parseUserId(userIdHeader?: string) {
    const parsed = UuidSchema.safeParse(userIdHeader);
    if (!parsed.success) {
      throw new UnprocessableEntityException({ message: 'Invalid x-user-id' });
    }
      return parsed.data;
    }

  private parseProfileUpdate(body: unknown) {
    const parsed = ProfileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException({ message: 'Invalid profile update data' });
    }
    return parsed.data;
  }
}
