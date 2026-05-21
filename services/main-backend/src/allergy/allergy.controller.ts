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
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AllergyService } from './allergy.service';
import { AllergyUpdateSchema } from '@meal/shared/types/allergy';
import { UuidSchema } from '@meal/shared/types/common';
import { RequireAuth } from '../auth/jwt-auth.guard';

@ApiTags('Allergy')
@ApiBearerAuth('JWT')
@Controller('v1/allergies')
export class AllergyController {
  constructor(private readonly allergyService: AllergyService) {}

  @Get()
  @RequireAuth()
  @ApiOperation({ summary: 'Lấy danh sách allergy của user hiện tại' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách allergy' })
  @ApiResponse({
    status: 401,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  getAllergy(@Req() request: AuthenticatedRequest) {
    const userId = this.getUserIdFromRequest(request);
    return this.allergyService.getAllergy(userId);
  }

  @Patch()
  @RequireAuth()
  @ApiOperation({ summary: 'Cập nhật danh sách allergy của user hiện tại' })
  @ApiResponse({ status: 200, description: 'Cập nhật allergy thành công' })
  @ApiResponse({
    status: 401,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  @ApiResponse({ status: 404, description: 'User or ingredient not found.' })
  @ApiResponse({
    status: 409,
    description: 'Ingredient conflict with favorite list, including structured conflict metadata.',
  })
  @ApiResponse({
    status: 422,
    description: 'Invalid request payload.',
  })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['ingredientIds'],
      properties: {
        ingredientIds: {
          type: 'array',
          items: { type: 'integer', format: 'int32' },
          example: [1, 2, 3],
        },
      },
    },
  })
  updateAllergy(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const userId = this.getUserIdFromRequest(request);
    const payload = this.parseAllergyUpdate(body);
    return this.allergyService.updateAllergy(userId, payload);
  }

  private getUserIdFromRequest(request: AuthenticatedRequest) {
    const parsed = UuidSchema.safeParse(request.user?.id);
    if (!parsed.success) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
    return parsed.data;
  }

  private parseAllergyUpdate(body: unknown) {
    const parsed = AllergyUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        message: 'Request body is invalid for allergy update.',
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
