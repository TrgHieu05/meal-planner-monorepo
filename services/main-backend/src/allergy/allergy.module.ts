import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { AllergyController } from './allergy.controller';
import { AllergyService } from './allergy.service';

@Module({
  imports: [PrismaModule],
  controllers: [AllergyController],
  providers: [AllergyService],
})
export class AllergyModule {}
