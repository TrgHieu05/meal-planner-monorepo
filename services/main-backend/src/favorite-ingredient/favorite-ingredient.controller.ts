import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FavoriteIngredientService } from './favorite-ingredient.service';
import { FavoriteIngredientUpdateSchema } from '@meal/shared/types/favorite-ingredient';
import { UuidSchema } from '@meal/shared/types/common';

@ApiTags('Favorite Ingredient')
@Controller('v1/favorite-ingredients')
export class FavoriteIngredientController {
  constructor(
    private readonly favoriteIngredientService: FavoriteIngredientService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách favorite ingredient của user hiện tại',
  })
  @ApiResponse({
    status: 200,
    description: 'Trả về danh sách favorite ingredient',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 422, description: 'Invalid request header.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  getFavoriteIngredient(@Headers('x-user-id') userIdHeader: string) {
    const userId = this.parseUserId(userIdHeader);
    return this.favoriteIngredientService.getFavoriteIngredient(userId);
  }

  @Patch()
  @ApiOperation({
    summary: 'Cập nhật danh sách favorite ingredient của user hiện tại',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật favorite ingredient thành công',
  })
  @ApiResponse({ status: 404, description: 'User or ingredient not found.' })
  @ApiResponse({
    status: 409,
    description: 'Ingredient conflict with allergy list.',
  })
  @ApiResponse({
    status: 422,
    description: 'Invalid request header or payload.',
  })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  updateFavoriteIngredient(
    @Headers('x-user-id') userIdHeader: string,
    @Body() body: unknown,
  ) {
    const userId = this.parseUserId(userIdHeader);
    const payload = this.parseFavoriteIngredientUpdate(body);
    return this.favoriteIngredientService.updateFavoriteIngredient(
      userId,
      payload,
    );
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
