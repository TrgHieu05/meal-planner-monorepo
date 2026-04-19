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
import { FavoriteIngredientService } from './favorite-ingredient.service';
import { FavoriteIngredientUpdateSchema } from '@meal/shared/types/favorite-ingredient';
import { UuidSchema } from '@meal/shared/types/common';
import { RequireAuth } from '../auth/jwt-auth.guard';

@ApiTags('Favorite Ingredient')
@ApiBearerAuth('JWT')
@Controller('v1/favorite-ingredients')
export class FavoriteIngredientController {
  constructor(
    private readonly favoriteIngredientService: FavoriteIngredientService,
  ) {}

  @Get()
  @RequireAuth()
  @ApiOperation({
    summary: 'Lấy danh sách favorite ingredient của user hiện tại',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách favorite ingredient',
  })
  @ApiResponse({
    status: 401,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  getFavoriteIngredient(@Req() request: AuthenticatedRequest) {
    const userId = this.getUserIdFromRequest(request);
    return this.favoriteIngredientService.getFavoriteIngredient(userId);
  }

  @Patch()
  @RequireAuth()
  @ApiOperation({
    summary: 'Cập nhật danh sách favorite ingredient của user hiện tại',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật favorite ingredient thành công',
  })
  @ApiResponse({
    status: 401,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  @ApiResponse({ status: 404, description: 'User or ingredient not found.' })
  @ApiResponse({
    status: 409,
    description: 'Ingredient conflict with allergy list.',
  })
  @ApiResponse({
    status: 422,
    description: 'Invalid request payload.',
  })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  @ApiBody({
    description: 'Favorite ingredient update payload',
    schema: {
      type: 'object',
      required: ['ingredientIds'],
      properties: {
        ingredientIds: {
          type: 'array',
          items: { type: 'integer', minimum: 1 },
          example: [3, 4, 9],
        },
      },
      additionalProperties: false,
    },
  })
  updateFavoriteIngredient(
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    const userId = this.getUserIdFromRequest(request);
    const payload = this.parseFavoriteIngredientUpdate(body);
    return this.favoriteIngredientService.updateFavoriteIngredient(
      userId,
      payload,
    );
  }

  private getUserIdFromRequest(request: AuthenticatedRequest) {
    const parsed = UuidSchema.safeParse(request.user?.id);
    if (!parsed.success) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
    return parsed.data;
  }

  private parseFavoriteIngredientUpdate(body: unknown) {
    const parsed = FavoriteIngredientUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        message: 'Request body is invalid for favorite ingredient update.',
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
