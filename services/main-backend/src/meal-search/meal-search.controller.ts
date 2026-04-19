import {
  BadRequestException,
  Controller,
  Get,
  Header,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CookingTimeSchema,
  MealSearchQuery,
  MealSearchQuerySchema,
  MealSearchResponseSchema,
} from '@meal/shared';
import { RequireAuth } from '../auth/jwt-auth.guard';
import { MealSearchService } from './meal-search.service';

@ApiTags('Meals')
@ApiBearerAuth('JWT')
@Controller('v1/meals')
export class MealSearchController {
  constructor(private readonly service: MealSearchService) {}

  @Get()
  @RequireAuth()
  @Header('X-API-Version', 'v1')
  @ApiOperation({
    summary:
      'Tìm kiếm món ăn theo chuỗi q (tên món hoặc nguyên liệu) với bộ lọc difficulty/cookingTime/allergies',
  })
  @ApiResponse({ status: 200, description: 'Trả về danh sách món ăn phù hợp' })
  @ApiResponse({
    status: 400,
    description: 'Invalid request (missing or invalid query params).',
  })
  @ApiResponse({
    status: 401,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  async search(@Query() query: Record<string, unknown>) {
    const parsed = MealSearchQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException({
        error: 'Bad Request',
        message: 'Invalid filter value',
        details: parsed.error.flatten(),
      });
    }
    const normalized = this.normalizeQuery(parsed.data);
    const result = await this.service.search(normalized);

    const safe = MealSearchResponseSchema.safeParse(result);
    if (!safe.success) {
      throw new BadRequestException({
        error: 'Bad Response',
        message: 'Response schema validation failed',
        details: safe.error.flatten(),
      });
    }
    return result;
  }

  private normalizeQuery(q: MealSearchQuery): {
    queryText: string;
    excludeIngredients: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    cookingTimeMaxMins?: number;
  } {
    const queryText = q.q.trim();
    if (queryText.length === 0) {
      throw new BadRequestException({
        error: 'Bad Request',
        message: 'Missing `q` parameter.',
      });
    }
    const excludeIngredients =
      typeof q.allergies === 'string' && q.allergies.length > 0
        ? q.allergies.split(',').map((s) => s.trim())
        : [];

    let cookingTimeMaxMins: number | undefined;
    if (q.cookingTime) {
      const v = CookingTimeSchema.safeParse(q.cookingTime);
      if (!v.success) {
        throw new BadRequestException({
          error: 'Bad Request',
          message: 'Invalid filter value: cookingTime',
        });
      }
      cookingTimeMaxMins =
        v.data === '<30m' ? 30 : v.data === '<45m' ? 45 : 60;
    }

    return {
      queryText,
      excludeIngredients,
      difficulty: q.difficulty,
      cookingTimeMaxMins,
    };
  }
}
