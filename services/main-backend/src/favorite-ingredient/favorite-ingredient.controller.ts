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
  constructor(private readonly favoriteIngredientService: FavoriteIngredientService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách favorite ingredient của user hiện tại' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách favorite ingredient' })
  getFavoriteIngredient(@Headers('x-user-id') userIdHeader: string) {
    const userId = this.parseUserId(userIdHeader);
    return this.favoriteIngredientService.getFavoriteIngredient(userId);
  }

  @Patch()
  @ApiOperation({ summary: 'Cập nhật danh sách favorite ingredient của user hiện tại' })
  @ApiResponse({ status: 200, description: 'Cập nhật favorite ingredient thành công' })
  @ApiResponse({ status: 422, description: 'Payload không hợp lệ' })
  updateFavoriteIngredient(
    @Headers('x-user-id') userIdHeader: string,
    @Body() body: unknown,
  ) {
    const userId = this.parseUserId(userIdHeader);
    const payload = this.parseFavoriteIngredientUpdate(body);
    return this.favoriteIngredientService.updateFavoriteIngredient(userId, payload);
  }

  private parseUserId(userIdHeader?: string) {
    const parsed = UuidSchema.safeParse(userIdHeader);
    if (!parsed.success) {
      throw new UnprocessableEntityException({ message: 'Invalid x-user-id' });
    }
    return parsed.data;
  }

  private parseFavoriteIngredientUpdate(body: unknown) {
    const parsed = FavoriteIngredientUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException(parsed.error);
    }
    return parsed.data;
  }
}