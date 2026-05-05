import {
  BadRequestException,
  Controller,
  Get,
  Header,
  InternalServerErrorException,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  MealSearchQuery,
  MealSearchQuerySchema,
  MealSearchResponseSchema,
  MealDetailResponseSchema,
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
      'Tìm kiếm món ăn theo q (tên món hoặc nguyên liệu). Nếu không truyền q sẽ trả về danh sách theo phân trang, có thể lọc theo difficulty/allergies/cookTimeMin/cookTimeMax',
  })
  @ApiResponse({ status: 200, description: 'Trả về danh sách món ăn phù hợp' })
  @ApiResponse({
    status: 400,
    description: 'Invalid query params.',
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
      throw new InternalServerErrorException({
        error: 'Internal Server Error',
        message: 'Response schema validation failed',
        details: safe.error.flatten(),
      });
    }
    return safe.data;
  }

  @Get(':id')
  @RequireAuth()
  @Header('X-API-Version', 'v1')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết 1 món ăn theo id' })
  @ApiResponse({ status: 200, description: 'Trả về thông tin món ăn' })
  @ApiResponse({ status: 400, description: 'Invalid id (must be a positive integer).' })
  @ApiResponse({ status: 401, description: 'Token không hợp lệ hoặc đã hết hạn' })
  @ApiResponse({ status: 404, description: 'Meal not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async getMealById(@Param('id') idStr: string) {
    const id = parseInt(idStr, 10);
    if (isNaN(id) || id <= 0) {
      throw new BadRequestException('Invalid id (must be a positive integer).');
    }

    const result = await this.service.getMealById(id);
    const safe = MealDetailResponseSchema.safeParse(result);
    if (!safe.success) {
      throw new InternalServerErrorException({
        error: 'Internal Server Error',
        message: 'Response schema validation failed',
        details: safe.error.flatten(),
      });
    }
    return safe.data;
  }

  private normalizeQuery(q: MealSearchQuery): {
    queryText: string;
    excludeIngredients: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    cookTimeMinMins?: number;
    cookTimeMaxMins?: number;
    page: number;
    pageSize: number;
  } {
    const queryText = (q.q ?? '').trim();
    const excludeIngredients =
      typeof q.allergies === 'string' && q.allergies.length > 0
        ? q.allergies.split(',').map((s) => s.trim())
        : [];

    return {
      queryText,
      excludeIngredients,
      difficulty: q.difficulty,
      cookTimeMinMins: q.cookTimeMin,
      cookTimeMaxMins: q.cookTimeMax,
      page: q.page,
      pageSize: q.pageSize,
    };
  }
}
