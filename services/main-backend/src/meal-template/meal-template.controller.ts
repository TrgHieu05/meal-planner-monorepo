import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnprocessableEntityException,
  Req,
  UnauthorizedException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { RequireAuth } from '../auth/jwt-auth.guard';
import { MealTemplateService } from './meal-template.service';
import {
  ApplyMealTemplateRequestSchema,
  CreateMealTemplateRequestSchema,
  UpdateMealTemplateRequestSchema,
  AddMealTemplateItemRequestSchema,
  UpdateMealTemplateItemRequestSchema,
  UpsertMealTemplateDayRequestSchema,
} from '@meal/shared';

type AuthenticatedRequest = {
  user?: {
    id?: string;
  };
};

@ApiTags('Meal Template')
@ApiBearerAuth('JWT')
@RequireAuth()
@Controller('v1/meal-templates')
export class MealTemplateController {
  constructor(private readonly service: MealTemplateService) {}

  private getUserId(request: AuthenticatedRequest): string {
    const userId = request.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }
    return userId;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo mới Meal Template' })
  @ApiResponse({ status: 201, description: 'Tạo meal template thành công' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 401, description: 'Token không hợp lệ hoặc đã hết hạn' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'My Template' },
        description: { type: 'string', nullable: true, example: 'Optional description' },
      },
    },
  })
  async createTemplate(@Req() request: AuthenticatedRequest, @Body() body: any) {
    const userId = this.getUserId(request);
    const parsed = CreateMealTemplateRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('Invalid payload');
    }
    return this.service.createTemplate(userId, parsed.data);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách Meal Template của user' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách meal template' })
  @ApiResponse({ status: 401, description: 'Token không hợp lệ hoặc đã hết hạn' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async getTemplates(@Req() request: AuthenticatedRequest) {
    const userId = this.getUserId(request);
    return this.service.getTemplates(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Xem chi tiết cấu trúc Meal Template' })
  @ApiResponse({ status: 200, description: 'Trả về chi tiết meal template' })
  @ApiResponse({ status: 400, description: 'Invalid id' })
  @ApiResponse({ status: 401, description: 'Token không hợp lệ hoặc đã hết hạn' })
  @ApiResponse({ status: 403, description: 'You do not have access to this template.' })
  @ApiResponse({ status: 404, description: 'Meal template not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async getTemplateDetail(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const userId = this.getUserId(request);
    return this.service.getTemplateDetail(userId, id);
  }

  @Post(':id/apply')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Áp dụng Meal Template vào menu thực tế' })
  @ApiResponse({ status: 200, description: 'Áp dụng meal template thành công' })
  @ApiResponse({ status: 400, description: 'Invalid id or payload' })
  @ApiResponse({ status: 401, description: 'Token không hợp lệ hoặc đã hết hạn' })
  @ApiResponse({ status: 403, description: 'You do not have access to this template.' })
  @ApiResponse({ status: 404, description: 'Meal template not found.' })
  @ApiResponse({ status: 422, description: 'Template has no days to apply or payload is invalid.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['startDate'],
      properties: {
        startDate: { type: 'string', example: '2026-05-10' },
        replaceExistingMeals: { type: 'boolean', example: true, default: true },
      },
    },
  })
  async applyTemplate(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: any,
  ) {
    const userId = this.getUserId(request);
    const parsed = ApplyMealTemplateRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('Invalid payload');
    }
    return this.service.applyTemplate(userId, id, parsed.data);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin chung của Meal Template' })
  @ApiResponse({ status: 200, description: 'Cập nhật meal template thành công' })
  @ApiResponse({ status: 400, description: 'Invalid id or payload' })
  @ApiResponse({ status: 401, description: 'Token không hợp lệ hoặc đã hết hạn' })
  @ApiResponse({ status: 403, description: 'You do not have access to this template.' })
  @ApiResponse({ status: 404, description: 'Meal template not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Updated Template Name' },
        description: { type: 'string', nullable: true, example: 'Updated description' },
      },
    },
  })
  async updateTemplate(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: any,
  ) {
    const userId = this.getUserId(request);
    const parsed = UpdateMealTemplateRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('Invalid payload');
    }
    return this.service.updateTemplate(userId, id, parsed.data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa Meal Template' })
  @ApiResponse({ status: 204, description: 'Xóa meal template thành công' })
  @ApiResponse({ status: 400, description: 'Invalid id' })
  @ApiResponse({ status: 401, description: 'Token không hợp lệ hoặc đã hết hạn' })
  @ApiResponse({ status: 403, description: 'You do not have access to this template.' })
  @ApiResponse({ status: 404, description: 'Meal template not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async deleteTemplate(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const userId = this.getUserId(request);
    await this.service.deleteTemplate(userId, id);
  }

  @Put(':id/days/:dayNumber')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ghi đè/Upsert toàn bộ các bữa của 1 ngày trong Template' })
  @ApiResponse({ status: 201, description: 'Upsert ngày thành công' })
  @ApiResponse({ status: 400, description: 'Invalid id or payload' })
  @ApiResponse({ status: 401, description: 'Token không hợp lệ hoặc đã hết hạn' })
  @ApiResponse({ status: 403, description: 'You do not have access to this template.' })
  @ApiResponse({ status: 404, description: 'Meal template not found.' })
  @ApiResponse({ status: 409, description: 'Duplicate mealId in request.' })
  @ApiResponse({ status: 422, description: 'dayNumber must be a positive integer' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['meals'],
      properties: {
        meals: {
          type: 'object',
          properties: {
            BREAKFAST: {
              type: 'array',
              items: {
                type: 'object',
                required: ['mealId', 'portionSize'],
                properties: {
                  mealId: { type: 'integer', format: 'int32', example: 1 },
                  portionSize: { type: 'number', example: 1 },
                },
              },
            },
            LUNCH: {
              type: 'array',
              items: {
                type: 'object',
                required: ['mealId', 'portionSize'],
                properties: {
                  mealId: { type: 'integer', format: 'int32', example: 2 },
                  portionSize: { type: 'number', example: 1 },
                },
              },
            },
            DINNER: {
              type: 'array',
              items: {
                type: 'object',
                required: ['mealId', 'portionSize'],
                properties: {
                  mealId: { type: 'integer', format: 'int32', example: 3 },
                  portionSize: { type: 'number', example: 1 },
                },
              },
            },
          },
        },
      },
    },
  })
  async upsertDay(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('dayNumber') dayNumberStr: string,
    @Body() body: any,
  ) {
    const userId = this.getUserId(request);
    const dayNumber = parseInt(dayNumberStr, 10);
    if (isNaN(dayNumber) || dayNumber <= 0) {
      throw new UnprocessableEntityException('dayNumber must be a positive integer');
    }

    const parsed = UpsertMealTemplateDayRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException('Invalid payload');
    }

    await this.service.upsertDay(userId, id, dayNumber, parsed.data);
    return { success: true };
  }

  @Post(':id/items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Thêm 1 món vào 1 ngày của Template' })
  @ApiResponse({ status: 201, description: 'Thêm món vào template thành công' })
  @ApiResponse({ status: 400, description: 'Invalid id' })
  @ApiResponse({ status: 401, description: 'Token không hợp lệ hoặc đã hết hạn' })
  @ApiResponse({ status: 403, description: 'You do not have access to this template.' })
  @ApiResponse({ status: 404, description: 'Meal template or meal not found.' })
  @ApiResponse({ status: 409, description: 'TEMPLATE_ITEM_CONFLICT' })
  @ApiResponse({ status: 422, description: 'Invalid payload' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['dayNumber', 'mealId', 'mealTime', 'portionSize'],
      properties: {
        dayNumber: { type: 'integer', format: 'int32', example: 1 },
        mealId: { type: 'integer', format: 'int32', example: 1 },
        mealTime: { type: 'string', enum: ['BREAKFAST', 'LUNCH', 'DINNER'], example: 'BREAKFAST' },
        portionSize: { type: 'number', example: 1 },
      },
    },
  })
  async addItem(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: any,
  ) {
    const userId = this.getUserId(request);
    const parsed = AddMealTemplateItemRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException('Invalid payload');
    }
    return this.service.addItem(userId, id, parsed.data);
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'Sửa portion size của 1 món trong Template' })
  @ApiResponse({ status: 200, description: 'Cập nhật món trong template thành công' })
  @ApiResponse({ status: 400, description: 'Invalid id or itemId' })
  @ApiResponse({ status: 401, description: 'Token không hợp lệ hoặc đã hết hạn' })
  @ApiResponse({ status: 403, description: 'You do not have access to this template.' })
  @ApiResponse({ status: 404, description: 'Template item not found.' })
  @ApiResponse({ status: 422, description: 'Invalid payload' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['portionSize'],
      properties: {
        portionSize: { type: 'number', example: 1 },
      },
    },
  })
  async updateItem(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
    @Body() body: any,
  ) {
    const userId = this.getUserId(request);
    const parsed = UpdateMealTemplateItemRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException('Invalid payload');
    }
    return this.service.updateItem(userId, id, itemId, parsed.data);
  }

  @Delete(':id/items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa 1 món khỏi Template' })
  @ApiResponse({ status: 204, description: 'Xóa món khỏi template thành công' })
  @ApiResponse({ status: 400, description: 'Invalid id or itemId' })
  @ApiResponse({ status: 401, description: 'Token không hợp lệ hoặc đã hết hạn' })
  @ApiResponse({ status: 403, description: 'You do not have access to this template.' })
  @ApiResponse({ status: 404, description: 'Template item not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async deleteItem(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('itemId', new ParseUUIDPipe({ version: '4' })) itemId: string,
  ) {
    const userId = this.getUserId(request);
    await this.service.deleteItem(userId, id, itemId);
  }

  @Delete(':id/days/:dayNumber')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa cả 1 ngày khỏi Template' })
  @ApiResponse({ status: 204, description: 'Xóa ngày khỏi template thành công' })
  @ApiResponse({ status: 400, description: 'Invalid id' })
  @ApiResponse({ status: 401, description: 'Token không hợp lệ hoặc đã hết hạn' })
  @ApiResponse({ status: 403, description: 'You do not have access to this template.' })
  @ApiResponse({ status: 404, description: 'Template day or template not found.' })
  @ApiResponse({ status: 422, description: 'dayNumber must be a positive integer' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async deleteDay(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('dayNumber') dayNumberStr: string,
  ) {
    const userId = this.getUserId(request);
    const dayNumber = parseInt(dayNumberStr, 10);
    if (isNaN(dayNumber) || dayNumber <= 0) {
      throw new UnprocessableEntityException('dayNumber must be a positive integer');
    }
    await this.service.deleteDay(userId, id, dayNumber);
  }
}
