import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  DietTypeListSchema,
  DietTypeSchema,
} from '@meal/shared/types/diet-type';
import { GoalListSchema, GoalSchema } from '@meal/shared/types/goal';
import {
  CuisineTypeListSchema,
  CuisineTypeSchema,
} from '@meal/shared/types/cuisine-type';

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

  async getDietTypeById(id: number) {
    const record = await this.prisma.dietType.findUnique({
      where: { id },
      select: { id: true, name: true, description: true },
    });
    if (!record) {
      throw new NotFoundException('Diet type not found.');
    }
    const parsed = DietTypeSchema.safeParse(record);
    if (!parsed.success) {
      throw new InternalServerErrorException('Invalid diet type data');
    }
    return parsed.data;
  }

  async getGoalById(id: number) {
    const record = await this.prisma.goal.findUnique({
      where: { id },
      select: { id: true, name: true, description: true },
    });
    if (!record) {
      throw new NotFoundException('Goal not found.');
    }
    const parsed = GoalSchema.safeParse(record);
    if (!parsed.success) {
      throw new InternalServerErrorException('Invalid goal data');
    }
    return parsed.data;
  }

  async getCuisineTypeById(id: number) {
    const record = await this.prisma.cuisineType.findUnique({
      where: { id },
      select: { id: true, name: true, description: true },
    });
    if (!record) {
      throw new NotFoundException('Cuisine type not found.');
    }
    const parsed = CuisineTypeSchema.safeParse(record);
    if (!parsed.success) {
      throw new InternalServerErrorException('Invalid cuisine type data');
    }
    return parsed.data;
  }
}
