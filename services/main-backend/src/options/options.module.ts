import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { OptionsController } from './options.controller';
import { OptionsService } from './options.service';

@Module({
  imports: [PrismaModule],
  controllers: [OptionsController],
  providers: [OptionsService],
})
export class OptionsModule {}
