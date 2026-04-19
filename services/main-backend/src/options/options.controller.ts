import {
  Controller,
  Get,
  Header,
  Param,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IntSchema } from '@meal/shared/types/common';
import { OptionsService } from './options.service';

@ApiTags('Options')
@Controller('v1/options')
export class OptionsController {
  constructor(private readonly optionsService: OptionsService) {}

  @Get('diet-types')
  @Header('X-API-Version', 'v1')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Lấy danh sách diet types' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách diet types' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  getDietTypes() {
    return this.optionsService.getDietTypes();
  }

  @Get('diet-types/:id')
  @Header('X-API-Version', 'v1')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Lấy chi tiết diet type theo id' })
  @ApiResponse({ status: 200, description: 'Trả về diet type theo id' })
  @ApiResponse({ status: 404, description: 'Diet type not found.' })
  @ApiResponse({ status: 422, description: 'Invalid option id.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  getDietTypeById(@Param('id') idParam: string) {
    const id = this.parseOptionId(idParam);
    return this.optionsService.getDietTypeById(id);
  }

  @Get('goals')
  @Header('X-API-Version', 'v1')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Lấy danh sách goals' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách goals' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  getGoals() {
    return this.optionsService.getGoals();
  }

  @Get('goals/:id')
  @Header('X-API-Version', 'v1')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Lấy chi tiết goal theo id' })
  @ApiResponse({ status: 200, description: 'Trả về goal theo id' })
  @ApiResponse({ status: 404, description: 'Goal not found.' })
  @ApiResponse({ status: 422, description: 'Invalid option id.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  getGoalById(@Param('id') idParam: string) {
    const id = this.parseOptionId(idParam);
    return this.optionsService.getGoalById(id);
  }

  @Get('cuisine-types')
  @Header('X-API-Version', 'v1')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Lấy danh sách cuisine types' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách cuisine types' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  getCuisineTypes() {
    return this.optionsService.getCuisineTypes();
  }

  @Get('cuisine-types/:id')
  @Header('X-API-Version', 'v1')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Lấy chi tiết cuisine type theo id' })
  @ApiResponse({ status: 200, description: 'Trả về cuisine type theo id' })
  @ApiResponse({ status: 404, description: 'Cuisine type not found.' })
  @ApiResponse({ status: 422, description: 'Invalid option id.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  getCuisineTypeById(@Param('id') idParam: string) {
    const id = this.parseOptionId(idParam);
    return this.optionsService.getCuisineTypeById(id);
  }

  private parseOptionId(idParam: string) {
    const candidate = Number(idParam);
    const parsed = IntSchema.safeParse(candidate);
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        message: 'Path parameter "id" must be a positive integer.',
      });
    }
    return parsed.data;
  }
}
