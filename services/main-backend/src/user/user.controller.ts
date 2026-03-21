import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserUpdateSchema } from '@meal/shared/types/user';
import { UuidSchema } from '@meal/shared/types/common';
import { UserService } from './user.service';


@ApiTags('User')
@Controller('v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: 200, description: 'Return current user information successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 422, description: 'Unprocessable request header or body' })
  @ApiResponse({ status: 500, description: 'Internal server error' })

  async getCurrentUser(@Headers('x-user-id') userIdHeader: string) {
    const userId = this.parseUserId(userIdHeader);
    return this.userService.getUser(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update current user information' })
  @ApiResponse({ status: 200, description: 'Return updated user information successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 422, description: 'Unprocessable request header or body' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateCurrentUser(
    @Headers('x-user-id') userIdHeader: string,
    @Body() body:unknown,
  ) {
    const userId = this.parseUserId(userIdHeader);
    const payload = this.parseUserUpdate(body);
    return this.userService.updateUser(userId, payload);
  }

  private parseUserUpdate(body: unknown) {
      const parsed = UserUpdateSchema.safeParse(body);
      if (!parsed.success) {
        throw new UnprocessableEntityException({
          message: 'Request body is invalid for user update.',
          details: parsed.error.flatten(),
        });
      }
      return parsed.data;
  }

  private parseUserId(userIdHeader?: string) {
    const parsed = UuidSchema.safeParse(userIdHeader);
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        message: 'Header "x-user-id" must be a valid UUID.',
      });
    }
    return parsed.data;
  }
}
