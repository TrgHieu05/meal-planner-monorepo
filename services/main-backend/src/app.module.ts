import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AllergyModule } from './allergy/allergy.module';
import { MetricModule } from './metric/metric.module';
import { OptionsModule } from './options/options.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    PrismaModule,
    AuthModule,
    AllergyModule,
    OptionsModule,
    MetricModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
