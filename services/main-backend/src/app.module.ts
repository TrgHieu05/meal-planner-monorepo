import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AllergyModule } from './allergy/allergy.module';
import { FavoriteIngredientModule } from './favorite-ingredient/favorite-ingredient.module';
import { MetricModule } from './metric/metric.module';
import { OptionsModule } from './options/options.module';
import { ProfileModule } from './profile/profile.module';
import { UserModule } from './user/user.module';
import { JwtAuthOptInGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    PrismaModule,
    AuthModule,
    AllergyModule,
    FavoriteIngredientModule,
    OptionsModule,
    UserModule,
    MetricModule,
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthOptInGuard,
    },
  ],
})
export class AppModule {}
