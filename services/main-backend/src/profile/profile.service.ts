import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  AllergyResponseSchema,
  FavoriteIngredientResponseSchema,
  ProfileOverviewResponseSchema,
  ProfileResponseSchema,
  ProfileUpdate,
} from '@meal/shared';
import { Uuid } from '@meal/shared/types/common';
import { MetricResponseSchema } from '@meal/shared/types/metric';
import { UserResponseSchema } from '@meal/shared/types/user';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getFullProfile(userId: Uuid) {
    await this.assertUserExists(userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        userName: true,
        gender: true,
        dateOfBirth: true,
      },
    });
    const parsedUser = UserResponseSchema.safeParse(user);
    if (!parsedUser.success) {
      throw new InternalServerErrorException(
        'Failed to map user data for profile overview.',
      );
    }

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Profile not found for the current user.');
    }
    const parsedProfile = ProfileResponseSchema.safeParse(profile);
    if (!parsedProfile.success) {
      throw new InternalServerErrorException(
        'Failed to map profile preference data.',
      );
    }

    const allergies = await this.prisma.allergy.findMany({
      where: { userId },
      select: {
        ingredient: {
          select: {
            name: true,
          },
        },
      },
    });
    const parsedAllergies = AllergyResponseSchema.safeParse({
      list: allergies.map((item) => item.ingredient),
    });
    if (!parsedAllergies.success) {
      throw new InternalServerErrorException('Failed to map allergy data.');
    }

    const favoriteIngredients = await this.prisma.favoriteIngredient.findMany({
      where: { userId },
      select: {
        ingredient: {
          select: {
            name: true,
          },
        },
      },
    });
    const parsedFavoriteIngredients =
      FavoriteIngredientResponseSchema.safeParse({
        list: favoriteIngredients.map((item) => item.ingredient),
      });
    if (!parsedFavoriteIngredients.success) {
      throw new InternalServerErrorException(
        'Failed to map favorite ingredient data.',
      );
    }

    const metric = await this.prisma.metric.findFirst({
      where: { userId },
      orderBy: {
        recordedAt: 'desc',
      },
    });
    const parsedMetric = MetricResponseSchema.safeParse(metric);
    if (!parsedMetric.success) {
      throw new InternalServerErrorException(
        'Failed to map latest metric data.',
      );
    }

    const profileOverview = {
      basic: parsedUser.data,
      preferences: parsedProfile.data,
      latestMetric: parsedMetric.data,
      allergies: parsedAllergies.data,
      favoriteIngredients: parsedFavoriteIngredients.data,
    };
    const parsedProfileOverview =
      ProfileOverviewResponseSchema.safeParse(profileOverview);
    if (!parsedProfileOverview.success) {
      throw new InternalServerErrorException(
        'Failed to map profile overview data.',
      );
    }
    return parsedProfileOverview.data;
  }

  async getProfile(userId: Uuid) {
    await this.assertUserExists(userId);

    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Profile not found for the current user.');
    }
    const parsedProfile = ProfileResponseSchema.safeParse(profile);
    if (!parsedProfile.success) {
      throw new InternalServerErrorException('Failed to map profile data.');
    }
    return parsedProfile.data;
  }

  async updateProfile(userId: Uuid, payload: ProfileUpdate) {
    await this.assertUserExists(userId);
    await this.assertProfileExists(userId);
    await this.assertProfileReferenceExists(payload);

    const profile = await this.prisma.profile.update({
      where: { userId },
      data: payload,
    });
    const parsedProfile = ProfileResponseSchema.safeParse(profile);
    if (!parsedProfile.success) {
      throw new InternalServerErrorException(
        'Failed to map updated profile data.',
      );
    }
    return parsedProfile.data;
  }

  private async assertUserExists(userId: Uuid) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException('User not found.');
    }
  }

  private async assertProfileExists(userId: Uuid) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { userId: true },
    });
    if (!profile) {
      throw new NotFoundException('Profile not found for the current user.');
    }
  }

  private async assertProfileReferenceExists(payload: ProfileUpdate) {
    if (payload.dietTypeId != null) {
      const dietType = await this.prisma.dietType.findUnique({
        where: { id: payload.dietTypeId },
        select: { id: true },
      });
      if (!dietType) {
        throw new NotFoundException(
          `Diet type with id ${payload.dietTypeId} was not found.`,
        );
      }
    }

    if (payload.goalId != null) {
      const goal = await this.prisma.goal.findUnique({
        where: { id: payload.goalId },
        select: { id: true },
      });
      if (!goal) {
        throw new NotFoundException(
          `Goal with id ${payload.goalId} was not found.`,
        );
      }
    }

    if (payload.cuisineTypeId != null) {
      const cuisineType = await this.prisma.cuisineType.findUnique({
        where: { id: payload.cuisineTypeId },
        select: { id: true },
      });
      if (!cuisineType) {
        throw new NotFoundException(
          `Cuisine type with id ${payload.cuisineTypeId} was not found.`,
        );
      }
    }
  }
}
