import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
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
  getLatestMetric(@Headers('x-user-id') userIdHeader: string) {
    const userId = this.parseUserId(userIdHeader);
    return this.metricService.getLatestMetric(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo metric mới cho user hiện tại' })
  @ApiResponse({ status: 201, description: 'Tạo metric thành công' })
  @ApiResponse({ status: 422, description: 'Payload không hợp lệ' })
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
      throw new BadRequestException({ message: 'Invalid x-user-id' });
    }
    return parsed.data;
  }

  private parseMetricCreate(body: unknown) {
    const parsed = MetricCreateSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error);
    }
    const { heightCm, weightKg } = parsed.data;
    if (heightCm == null || weightKg == null) {
      throw new BadRequestException({
        message: 'Height (Cm) and weight (Kg) are required',
      });
    }
    return { heightCm, weightKg };
  }
}
