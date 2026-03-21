import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MetricCreateSchema } from '@meal/shared/types/metric';
import { UuidSchema } from '@meal/shared/types/common';
import { MetricService } from './metric.service';

@ApiTags('Metric')
@Controller('v1/metrics')
export class MetricController {
  constructor(private readonly metricService: MetricService) {}

  @Get('latest')
  @ApiOperation({ summary: 'Lấy metric gần nhất của user hiện tại' })
  @ApiResponse({ status: 200, description: 'Trả về metric gần nhất hoặc null' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 422, description: 'Invalid request header.' })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  getLatestMetric(@Headers('x-user-id') userIdHeader: string) {
    const userId = this.parseUserId(userIdHeader);
    return this.metricService.getLatestMetric(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo metric mới cho user hiện tại' })
  @ApiResponse({ status: 201, description: 'Tạo metric thành công' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({
    status: 422,
    description: 'Invalid request header or payload.',
  })
  @ApiResponse({ status: 500, description: 'Internal server error.' })
  createMetric(
    @Headers('x-user-id') userIdHeader: string,
    @Body() body: unknown,
  ) {
    const userId = this.parseUserId(userIdHeader);
    const payload = this.parseMetricCreate(body);
    return this.metricService.createMetric(userId, payload);
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
