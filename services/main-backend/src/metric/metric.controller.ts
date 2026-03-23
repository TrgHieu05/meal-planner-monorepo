import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnprocessableEntityException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MetricCreateSchema } from '@meal/shared/types/metric';
import { UuidSchema } from '@meal/shared/types/common';
import { MetricService } from './metric.service';
import { RequireAuth } from '../auth/jwt-auth.guard';

@ApiTags('Metric')
@ApiBearerAuth('JWT')
@Controller('v1/metrics')
export class MetricController {
  constructor(private readonly metricService: MetricService) {}

  @Get('latest')
  @RequireAuth()
  @ApiOperation({ summary: 'Lấy metric gần nhất của user hiện tại' })
  @ApiResponse({ status: 200, description: 'Trả về metric gần nhất hoặc null' })
  @ApiResponse({
    status: 401,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  getLatestMetric(@Req() request: AuthenticatedRequest) {
    const userId = this.getUserIdFromRequest(request);
    return this.metricService.getLatestMetric(userId);
  }

  @Post()
  @RequireAuth()
  @ApiOperation({ summary: 'Tạo metric mới cho user hiện tại' })
  @ApiResponse({ status: 201, description: 'Tạo metric thành công' })
  @ApiResponse({
    status: 401,
    description: 'Token không hợp lệ hoặc đã hết hạn',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({
    status: 422,
    description: 'Invalid request payload.',
  })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  createMetric(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    const userId = this.getUserIdFromRequest(request);
    const payload = this.parseMetricCreate(body);
    return this.metricService.createMetric(userId, payload);
  }

  private getUserIdFromRequest(request: AuthenticatedRequest) {
    const parsed = UuidSchema.safeParse(request.user?.id);
    if (!parsed.success) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
    return parsed.data;
  }

  private parseMetricCreate(body: unknown) {
    const parsed = MetricCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new UnprocessableEntityException({
        message: 'Request body is invalid for metric creation.',
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
