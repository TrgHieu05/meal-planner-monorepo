import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DietTypeListSchema } from '@meal/shared/types/diet-type';
import { GoalListSchema } from '@meal/shared/types/goal';
import { CuisineTypeListSchema } from '@meal/shared/types/cuisine-type';

@Injectable()
export class OptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDietTypes() {
    const records = await this.prisma.dietType.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, name: true, description: true },
    });
    const parsed = DietTypeListSchema.safeParse(records);
    if (!parsed.success) {
      throw new InternalServerErrorException('Invalid diet types data');
    }
    return parsed.data;
  }

  async getGoals() {
    const records = await this.prisma.goal.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, name: true, description: true },
    });
    const parsed = GoalListSchema.safeParse(records);
    if (!parsed.success) {
      throw new InternalServerErrorException('Invalid goals data');
    }
    return parsed.data;
  }

  async getCuisineTypes() {
    const records = await this.prisma.cuisineType.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, name: true, description: true },
    });
    const parsed = CuisineTypeListSchema.safeParse(records);
    if (!parsed.success) {
      throw new InternalServerErrorException('Invalid cuisine types data');
    }
    return parsed.data;
  }
}
