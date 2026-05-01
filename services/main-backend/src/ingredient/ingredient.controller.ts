import {
  Controller,
  Get,
  Header,
  Query,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IngredientCatalogQuerySchema } from '@meal/shared/types/ingredient';
import { IngredientService } from './ingredient.service';

@ApiTags('Ingredient')
@Controller('v1/ingredients')
export class IngredientController {
  constructor(private readonly ingredientService: IngredientService) {}

  @Get()
  @Header('X-API-Version', 'v1')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Get ingredient catalog with optional browse and search' })
  @ApiQuery({ name: 'q', required: false, example: 'egg' })
  @ApiQuery({
    name: 'page',
    required: false,
    schema: { type: 'integer', minimum: 1, default: 1 },
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    schema: { type: 'integer', enum: [30], default: 30 },
  })
  @ApiResponse({
    status: 200,
    description: 'Return ingredient catalog for browse/search.',
  })
  @ApiResponse({ status: 422, description: 'Invalid query parameters.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  getCatalog(@Query() query: Record<string, unknown>) {
    const parsed = IngredientCatalogQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        message: 'Query parameters are invalid for ingredient catalog.',
        details: parsed.error.flatten(),
      });
    }

    return this.ingredientService.getCatalog(parsed.data);
  }
}