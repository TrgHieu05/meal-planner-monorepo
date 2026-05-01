import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  DateStringSchema,
  IntSchema,
  UuidSchema,
} from '@meal/shared/types/common';
import { MenuItemCreateSchema, MenuItemUpdateSchema } from '@meal/shared';
import { randomUUID } from 'node:crypto';
import { RequireAuth } from '../auth/jwt-auth.guard';
import { MenuService } from './menu.service';

@ApiTags('Menu')
@ApiBearerAuth('JWT')
@Controller('v1')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('menus/day/:date')
  @RequireAuth()
  @ApiOperation({ summary: 'Get daily menu for the current user' })
  @ApiResponse({ status: 200, description: 'Returns menu data for the given day.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token.' })
  @ApiResponse({ status: 422, description: 'Invalid date format.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async getMenuByDay(
    @Req() request: AuthenticatedRequest,
    @Param('date') dateParam: string,
  ) {
    return this.executeWithMenuErrorEnvelope(request, async () => {
      const userId = this.getUserIdFromRequest(request);
      const date = this.parseDateParam(dateParam);
      return this.menuService.getMenuByDay(userId, date);
    });
  }

  @Delete('menus/day/:date')
  @RequireAuth()
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete all menu items for a specific day' })
  @ApiResponse({ status: 204, description: 'Deleted successfully, or the day was already empty.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token.' })
  @ApiResponse({ status: 422, description: 'Invalid date format.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async deleteMenuByDay(
    @Req() request: AuthenticatedRequest,
    @Param('date') dateParam: string,
  ): Promise<void> {
    await this.executeWithMenuErrorEnvelope(request, async () => {
      const userId = this.getUserIdFromRequest(request);
      const date = this.parseDateParam(dateParam);
      await this.menuService.deleteMenuByDay(userId, date);
    });
  }

  @Post('menu-items')
  @RequireAuth()
  @ApiOperation({ summary: 'Create a menu item for a day and meal time' })
  @ApiResponse({ status: 201, description: 'Menu item created successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token.' })
  @ApiResponse({ status: 404, description: 'Meal not found.' })
  @ApiResponse({ status: 409, description: 'Duplicate meal in the same day and meal time.' })
  @ApiResponse({ status: 422, description: 'Invalid request payload.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  @ApiBody({
    description: 'Menu item creation payload',
    schema: {
      type: 'object',
      required: ['date', 'mealId', 'mealTime', 'portionSize'],
      properties: {
        date: { type: 'string', format: 'date', example: '2026-03-24' },
        mealId: { type: 'integer', minimum: 1, example: 12 },
        mealTime: {
          type: 'string',
          enum: ['BREAKFAST', 'LUNCH', 'DINNER'],
          example: 'BREAKFAST',
        },
        portionSize: { type: 'number', minimum: 0.01, example: 1.5 },
      },
      additionalProperties: false,
    },
  })
  async createMenuItem(
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    return this.executeWithMenuErrorEnvelope(request, async () => {
      const userId = this.getUserIdFromRequest(request);
      const payload = this.parseMenuItemCreate(body);
      return this.menuService.createMenuItem(userId, payload);
    });
  }

  @Patch('menu-items/:id')
  @RequireAuth()
  @ApiOperation({ summary: 'Update a menu item by id' })
  @ApiResponse({ status: 200, description: 'Menu item updated successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token.' })
  @ApiResponse({ status: 404, description: 'Menu item not found.' })
  @ApiResponse({ status: 409, description: 'Conflict while updating menu item.' })
  @ApiResponse({ status: 422, description: 'Invalid path parameter or request payload.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  @ApiBody({
    description: 'Menu item update payload',
    schema: {
      type: 'object',
      properties: {
        portionSize: { type: 'number', minimum: 0.01, example: 1.25 },
        eated: { type: 'boolean', example: true },
      },
      additionalProperties: false,
      example: {
        portionSize: 1.25,
        eated: true,
      },
    },
  })
  async updateMenuItem(
    @Req() request: AuthenticatedRequest,
    @Param('id') idParam: string,
    @Body() body: unknown,
  ) {
    return this.executeWithMenuErrorEnvelope(request, async () => {
      const userId = this.getUserIdFromRequest(request);
      const id = this.parseIdParam(idParam);
      const payload = this.parseMenuItemUpdate(body);
      return this.menuService.updateMenuItem(userId, id, payload);
    });
  }

  @Delete('menu-items/:id')
  @RequireAuth()
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a menu item by id' })
  @ApiResponse({ status: 204, description: 'Menu item deleted successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired token.' })
  @ApiResponse({ status: 404, description: 'Menu item not found.' })
  @ApiResponse({ status: 422, description: 'Invalid path parameter.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  async deleteMenuItem(
    @Req() request: AuthenticatedRequest,
    @Param('id') idParam: string,
  ): Promise<void> {
    await this.executeWithMenuErrorEnvelope(request, async () => {
      const userId = this.getUserIdFromRequest(request);
      const id = this.parseIdParam(idParam);
      await this.menuService.deleteMenuItem(userId, id);
    });
  }

  private async executeWithMenuErrorEnvelope<T>(
    request: AuthenticatedRequest,
    action: () => Promise<T>,
  ): Promise<T> {
    try {
      return await action();
    } catch (error) {
      throw this.toMenuHttpException(error, request);
    }
  }

  private toMenuHttpException(error: unknown, request: AuthenticatedRequest) {
    if (!(error instanceof HttpException)) {
      return new HttpException(
        {
          requestId: this.getRequestId(request),
          code: 'MENU_INTERNAL_ERROR',
          message: 'An unexpected menu error occurred.',
          timestamp: new Date().toISOString(),
        },
        500,
      );
    }

    const status = error.getStatus();
    const response = error.getResponse();

    let message = 'An unexpected menu error occurred.';
    let details: unknown;

    if (typeof response === 'string') {
      message = response;
    } else if (response && typeof response === 'object') {
      const responseObject = response as Record<string, unknown>;
      const rawMessage = responseObject.message;
      if (typeof rawMessage === 'string') {
        message = rawMessage;
      } else if (Array.isArray(rawMessage) && typeof rawMessage[0] === 'string') {
        message = rawMessage[0];
      }
      details = responseObject.details;
    }

    const payload: Record<string, unknown> = {
      requestId: this.getRequestId(request),
      code: this.mapMenuErrorCode(status),
      message,
      timestamp: new Date().toISOString(),
    };

    if (details != null) {
      payload.details = details;
    }

    return new HttpException(payload, status);
  }

  private mapMenuErrorCode(status: number) {
    if (status === 401) {
      return 'MENU_UNAUTHORIZED';
    }
    if (status === 403) {
      return 'MENU_FORBIDDEN';
    }
    if (status === 404) {
      return 'MENU_NOT_FOUND';
    }
    if (status === 409) {
      return 'MENU_CONFLICT';
    }
    if (status === 422) {
      return 'MENU_VALIDATION_ERROR';
    }
    return 'MENU_INTERNAL_ERROR';
  }

  private getRequestId(request: AuthenticatedRequest) {
    const value = request.headers?.['x-request-id'];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
    if (Array.isArray(value) && typeof value[0] === 'string') {
      return value[0];
    }
    return randomUUID();
  }

  private getUserIdFromRequest(request: AuthenticatedRequest) {
    const parsed = UuidSchema.safeParse(request.user?.id);
    if (!parsed.success) {
      throw new UnauthorizedException('Invalid or expired token.');
    }
    return parsed.data;
  }

  private parseDateParam(dateParam: string) {
    const parsed = DateStringSchema.safeParse(dateParam);
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        message: 'Date path param is invalid. Expected format: YYYY-MM-DD.',
        details: parsed.error.flatten(),
      });
    }
    this.assertCalendarDate(parsed.data, 'Date path param');
    return parsed.data;
  }

  private assertCalendarDate(value: string, fieldName: string) {
    const [year, month, day] = value.split('-').map((part) => Number(part));
    const utcDate = new Date(Date.UTC(year, month - 1, day));

    if (
      Number.isNaN(utcDate.getTime()) ||
      utcDate.getUTCFullYear() !== year ||
      utcDate.getUTCMonth() !== month - 1 ||
      utcDate.getUTCDate() !== day
    ) {
      throw new UnprocessableEntityException({
        message: `${fieldName} must be a valid calendar date in YYYY-MM-DD format.`,
      });
    }
  }

  private parseIdParam(idParam: string) {
    const parsed = IntSchema.safeParse(Number(idParam));
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        message: 'Path param "id" must be a positive integer.',
        details: parsed.error.flatten(),
      });
    }
    return parsed.data;
  }

  private parseMenuItemCreate(body: unknown) {
    const parsed = MenuItemCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        message: 'Request body is invalid for menu item creation.',
        details: parsed.error.flatten(),
      });
    }

    this.assertCalendarDate(parsed.data.date, 'Body field "date"');

    return parsed.data;
  }

  private parseMenuItemUpdate(body: unknown) {
    const parsed = MenuItemUpdateSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        message: 'Request body is invalid for menu item update.',
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
  headers?: {
    'x-request-id'?: string | string[];
  };
};
