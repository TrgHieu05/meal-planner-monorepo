import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { MediaModule } from '../media/media.module';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';

@Module({
  imports: [PrismaModule, MediaModule],
  controllers: [MenuController],
  providers: [MenuService],
})
export class MenuModule {}
