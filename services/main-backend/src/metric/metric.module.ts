import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { MetricController } from './metric.controller';
import { MetricService } from './metric.service';

@Module({
  imports: [PrismaModule],
  controllers: [MetricController],
  providers: [MetricService],
})
export class MetricModule {}
