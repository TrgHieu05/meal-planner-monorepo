import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  CreateMealTemplateRequest,
  UpdateMealTemplateRequest,
  MealTemplateListResponse,
  MealTemplateDetailResponse,
  AddMealTemplateItemRequest,
  UpdateMealTemplateItemRequest,
  UpsertMealTemplateDayRequest,
  MealTemplateItemResponse,
  MealTime,
} from '@meal/shared';

@Injectable()
export class MealTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  // Helpers
  private async checkOwnership(templateId: string, userId: string) {
    const template = await this.prisma.mealTemplate.findUnique({
      where: { id: templateId },
      select: { userId: true },
    });

    if (!template) {
      throw new NotFoundException('Meal template not found.');
    }

    if (template.userId !== userId) {
      throw new ForbiddenException('You do not have access to this template.');
    }
  }

  // --- Core Template Operations ---

  async createTemplate(userId: string, data: CreateMealTemplateRequest) {
    const template = await this.prisma.mealTemplate.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
      },
    });
    return template;
  }

  async getTemplates(userId: string): Promise<MealTemplateListResponse> {
    const templates = await this.prisma.mealTemplate.findMany({
      where: { userId },
      include: {
        _count: {
          select: { days: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      list: templates.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        dayCount: t._count.days,
      })),
    };
  }

  async getTemplateDetail(userId: string, id: string): Promise<MealTemplateDetailResponse> {
    await this.checkOwnership(id, userId);

    const template = await this.prisma.mealTemplate.findUnique({
      where: { id },
      include: {
        days: {
          include: {
            items: {
              include: { meal: true },
            },
          },
          orderBy: { dayNumber: 'asc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Meal template not found.');
    }

    const mapItems = (items: any[], mealTime: MealTime): MealTemplateItemResponse[] => {
      return items
        .filter((i) => i.mealTime === mealTime)
        .map((i) => ({
          itemId: i.id,
          mealId: i.mealId,
          mealName: i.meal.name,
          portionSize: i.portionSize,
        }));
    };

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      days: template.days.map((day) => ({
        dayNumber: day.dayNumber,
        meals: {
          BREAKFAST: mapItems(day.items, 'BREAKFAST'),
          LUNCH: mapItems(day.items, 'LUNCH'),
          DINNER: mapItems(day.items, 'DINNER'),
        },
      })),
    };
  }

  async updateTemplate(userId: string, id: string, data: UpdateMealTemplateRequest) {
    await this.checkOwnership(id, userId);

    const updated = await this.prisma.mealTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
    return updated;
  }

  async deleteTemplate(userId: string, id: string) {
    await this.checkOwnership(id, userId);
    await this.prisma.mealTemplate.delete({ where: { id } });
  }

  // --- Day & Item Operations ---

  async upsertDay(userId: string, templateId: string, dayNumber: number, data: UpsertMealTemplateDayRequest) {
    await this.checkOwnership(templateId, userId);

    // Dùng transaction để đảm bảo atomic (xóa cũ, thêm mới)
    await this.prisma.$transaction(async (tx) => {
      let day = await tx.mealTemplateDay.findUnique({
        where: {
          templateId_dayNumber: { templateId, dayNumber },
        },
      });

      if (!day) {
        day = await tx.mealTemplateDay.create({
          data: { templateId, dayNumber },
        });
      } else {
        // Xóa hết item cũ của ngày này để upsert
        await tx.mealTemplateDayItem.deleteMany({
          where: { dayId: day.id },
        });
      }

      // Chuẩn bị payload tạo item mới
      const newItems: any[] = [];
      const mealTimes: MealTime[] = ['BREAKFAST', 'LUNCH', 'DINNER'];
      
      for (const time of mealTimes) {
        const itemsForTime = data.meals[time];
        if (itemsForTime && itemsForTime.length > 0) {
          // Check nghiệp vụ trùng lặp ngay trong code
          const seenMeals = new Set<number>();
          for (const item of itemsForTime) {
            if (seenMeals.has(item.mealId)) {
              throw new ConflictException(`Duplicate mealId ${item.mealId} in ${time} of day ${dayNumber}`);
            }
            seenMeals.add(item.mealId);
            newItems.push({
              dayId: day.id,
              mealId: item.mealId,
              mealTime: time,
              portionSize: item.portionSize,
            });
          }
        }
      }

      if (newItems.length > 0) {
        await tx.mealTemplateDayItem.createMany({
          data: newItems,
        });
      }
    });
  }

  async addItem(userId: string, templateId: string, data: AddMealTemplateItemRequest) {
    await this.checkOwnership(templateId, userId);

    // Verify meal exists
    const meal = await this.prisma.meal.findUnique({ where: { id: data.mealId } });
    if (!meal) {
      throw new NotFoundException('Meal not found.');
    }

    return this.prisma.$transaction(async (tx) => {
      let day = await tx.mealTemplateDay.findUnique({
        where: { templateId_dayNumber: { templateId, dayNumber: data.dayNumber } },
      });

      if (!day) {
        day = await tx.mealTemplateDay.create({
          data: { templateId, dayNumber: data.dayNumber },
        });
      }

      // Check conflict
      const existingItem = await tx.mealTemplateDayItem.findFirst({
        where: {
          dayId: day.id,
          mealTime: data.mealTime,
          mealId: data.mealId,
        },
      });

      if (existingItem) {
        throw new ConflictException('TEMPLATE_ITEM_CONFLICT');
      }

      const created = await tx.mealTemplateDayItem.create({
        data: {
          dayId: day.id,
          mealId: data.mealId,
          mealTime: data.mealTime,
          portionSize: data.portionSize,
        },
      });

      return created;
    });
  }

  async updateItem(userId: string, templateId: string, itemId: string, data: UpdateMealTemplateItemRequest) {
    await this.checkOwnership(templateId, userId);

    const item = await this.prisma.mealTemplateDayItem.findUnique({
      where: { id: itemId },
      include: { day: true, meal: true },
    });

    if (!item || item.day.templateId !== templateId) {
      throw new NotFoundException('Template item not found.');
    }

    const updated = await this.prisma.mealTemplateDayItem.update({
      where: { id: itemId },
      data: { portionSize: data.portionSize },
      include: { meal: true },
    });

    const response: MealTemplateItemResponse = {
      itemId: updated.id,
      mealId: updated.mealId,
      mealName: updated.meal.name,
      portionSize: updated.portionSize,
    };
    return response;
  }

  async deleteItem(userId: string, templateId: string, itemId: string) {
    await this.checkOwnership(templateId, userId);

    const item = await this.prisma.mealTemplateDayItem.findUnique({
      where: { id: itemId },
      include: { day: true },
    });

    if (!item || item.day.templateId !== templateId) {
      throw new NotFoundException('Template item not found.');
    }

    await this.prisma.mealTemplateDayItem.delete({ where: { id: itemId } });
  }

  async deleteDay(userId: string, templateId: string, dayNumber: number) {
    await this.checkOwnership(templateId, userId);

    const day = await this.prisma.mealTemplateDay.findUnique({
      where: { templateId_dayNumber: { templateId, dayNumber } },
    });

    if (!day) {
      throw new NotFoundException('Template day not found.');
    }

    await this.prisma.mealTemplateDay.delete({ where: { id: day.id } });
  }
}
