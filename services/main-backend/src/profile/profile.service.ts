import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AllergyResponseSchema, FavoriteIngredientResponseSchema, ProfileOverviewResponseSchema, ProfileResponseSchema, ProfileUpdate  } from '@meal/shared';
import { Uuid, Int } from '@meal/shared/types/common';
import { MetricResponseSchema } from '@meal/shared/types/metric';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getFullProfile(userId: Uuid) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
        return null;
    }
    const parsedUser = ProfileOverviewResponseSchema.safeParse(user);
    if (!parsedUser.success) {
      throw new InternalServerErrorException('Invalid user data');
    }

    const profile = await this.prisma.profile.findUnique({
      where: { userId: userId },
    });
    if (!profile) {
        return null;
    }
    const parsedProfile = ProfileOverviewResponseSchema.safeParse(profile);
    if (!parsedProfile.success) {
      throw new InternalServerErrorException('Invalid profile data');
    }

    const allergies = await this.prisma.allergy.findMany({
      where: { userId: userId },
      select: {
        ingredient: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    const parsedAllergies = AllergyResponseSchema.safeParse(allergies);
    if (!parsedAllergies.success) {
      throw new InternalServerErrorException('Invalid allergy data');
    }

    const favoriteIngredients = await this.prisma.favoriteIngredient.findMany({
      where: { userId: userId },
      select: {
        ingredient: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    const parsedFavoriteIngredients = FavoriteIngredientResponseSchema.safeParse(favoriteIngredients);
    if (!parsedFavoriteIngredients.success) {
      throw new InternalServerErrorException('Invalid favorite ingredient data');
    }

    const metric = await this.prisma.metric.findFirst({
      where: { userId: userId },
      orderBy: {
        recordedAt: 'desc',
      },
    });
    const parsedMetric = MetricResponseSchema.safeParse(metric);
    if (!parsedMetric.success) {
      throw new InternalServerErrorException('Invalid metric data');
    }

    const profileOverview = {
      basic: parsedUser.data.basic,
      preferences: parsedProfile.data.preferences,
      latestMetric: parsedMetric.data,
      allergies: parsedAllergies.data,
      favoriteIngredients: parsedFavoriteIngredients.data,
    };
    const parsedProfileOverview = ProfileOverviewResponseSchema.safeParse(profileOverview);
    if (!parsedProfileOverview.success) {
      throw new InternalServerErrorException('Invalid profile overview data');
    }
    return parsedProfileOverview.data;
  }

  async getProfile(userId: Uuid) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId: userId },
    });
    if (!profile) {
        return null;
    }
    const parsedProfile = ProfileOverviewResponseSchema.safeParse(profile);
    if (!parsedProfile.success) {
      throw new InternalServerErrorException('Invalid profile data');
    }
    return parsedProfile.data;
  }

  async updateProfile(userId: Uuid, payload: ProfileUpdate) {
    const profile = await this.prisma.profile.update({
      where: { userId: userId },
      data: payload,
    });
    if (!profile) {
        return null;
    }
    const parsedProfile = ProfileResponseSchema.safeParse(profile);
    if (!parsedProfile.success) {
      throw new InternalServerErrorException('Invalid profile data');
    }
    return parsedProfile.data;
  }
}
