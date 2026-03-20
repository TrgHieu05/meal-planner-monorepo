import { Controller, Get, Header } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  getDietTypes() {
    return this.optionsService.getDietTypes();
  }

  @Get('goals')
  @Header('X-API-Version', 'v1')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Lấy danh sách goals' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách goals' })
  getGoals() {
    return this.optionsService.getGoals();
  }

  @Get('cuisine-types')
  @Header('X-API-Version', 'v1')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Lấy danh sách cuisine types' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách cuisine types' })
  getCuisineTypes() {
    return this.optionsService.getCuisineTypes();
  }
}
