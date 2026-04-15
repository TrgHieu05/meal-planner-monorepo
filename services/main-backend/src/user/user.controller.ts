import {
  Body,
  Controller,
  Get,
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
import { UserUpdateSchema } from '@meal/shared/types/user';
import { UuidSchema } from '@meal/shared/types/common';
import { UserService } from './user.service';
import { RequireAuth } from '../auth/jwt-auth.guard';

@ApiTags('User')
@ApiBearerAuth('JWT')
@Controller('v1/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @RequireAuth()
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({
    status: 200,
    description: 'Return current user information successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getCurrentUser(@Req() request: AuthenticatedRequest) {
    const userId = this.getUserIdFromRequest(request);
    return this.userService.getUser(userId);
  }

  @Patch()
  @RequireAuth()
  @ApiOperation({ summary: 'Update current user information' })
  @ApiResponse({
    status: 200,
    description: 'Return updated user information successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({
    status: 422,
    description: 'Unprocessable request body',
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  @ApiBody({
    description: 'Current user update payload',
    schema: {
      type: 'object',
      properties: {
        userName: { type: 'string', example: 'Nguyen Van A' },
        gender: { type: 'string', enum: ['M', 'F'], example: 'M' },
        dateOfBirth: {
          type: 'string',
          format: 'date',
          nullable: true,
          example: '2001-08-15',
        },
      },
      additionalProperties: false,
    },
  })
  async updateCurrentUser(
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    const userId = this.getUserIdFromRequest(request);
    const payload = this.parseUserUpdate(body);
    return this.userService.updateUser(userId, payload);
  }

  private parseUserUpdate(body: unknown) {
    const normalizedBody = this.normalizeUserUpdateBody(body);
    const parsed = UserUpdateSchema.safeParse(normalizedBody);
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        message: 'Request body is invalid for user update.',
        details: parsed.error.flatten(),
      });
    }
    return parsed.data;
  }

  private normalizeUserUpdateBody(body: unknown) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return body;
    }

    const candidate = { ...body } as Record<string, unknown>;
    const dateOfBirth = candidate.dateOfBirth;
    if (typeof dateOfBirth !== 'string') {
      return candidate;
    }

    const parsedDateOfBirth = this.parseDateOnlyString(dateOfBirth);
    candidate.dateOfBirth = parsedDateOfBirth;
    return candidate;
  }

  private parseDateOnlyString(value: string) {
    const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateOnlyPattern.test(value)) {
      throw new UnprocessableEntityException({
        message: 'Field "dateOfBirth" must use "YYYY-MM-DD" format.',
      });
    }

    const date = new Date(`${value}T00:00:00.000Z`);
    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      throw new UnprocessableEntityException({
        message:
          'Field "dateOfBirth" must be a valid calendar date in "YYYY-MM-DD" format.',
      });
    }

    return date;
  }

  private getUserIdFromRequest(request: AuthenticatedRequest) {
    const parsed = UuidSchema.safeParse(request.user?.id);
    if (!parsed.success) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
    return parsed.data;
  }
}

type AuthenticatedRequest = {
  user?: {
    id?: string;
  };
};
