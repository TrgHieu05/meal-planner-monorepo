import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  ApplyMealTemplateRequest,
  ApplyMealTemplateResponse,
  CreateMealTemplateRequest,
  UpdateMealTemplateRequest,
  MealTemplateListResponse,
  MealTemplateDetailResponse,
  AddMealTemplateItemRequest,
  UpdateMealTemplateItemRequest,
  UpsertMealTemplateDayRequest,
  MealTemplateItemResponse,
  MealTemplateNutrition,
  MealTime,
} from '@meal/shared';

@Injectable()
export class MealTemplateService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly emptyNutrition: MealTemplateNutrition = {
    calories: 0,
    protein: 0,
    fat: 0,
    fiber: 0,
  };

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

  private roundTo2(value: number) {
    return Math.round(value * 100) / 100;
  }

  private buildNutritionFromMeal(meal: {
    totalCalories: number;
    totalProtein: number;
    totalFat: number;
    totalFiber: number;
  }): MealTemplateNutrition {
    return {
      calories: this.roundTo2(meal.totalCalories),
      protein: this.roundTo2(meal.totalProtein),
      fat: this.roundTo2(meal.totalFat),
      fiber: this.roundTo2(meal.totalFiber),
    };
  }

  private sumItemNutrition(items: Array<{
    portionSize: number;
    meal: {
      totalCalories: number;
      totalProtein: number;
      totalFat: number;
      totalFiber: number;
    };
  }>): MealTemplateNutrition {
    const totals = items.reduce(
      (accumulator, item) => {
        accumulator.calories += item.meal.totalCalories * item.portionSize;
        accumulator.protein += item.meal.totalProtein * item.portionSize;
        accumulator.fat += item.meal.totalFat * item.portionSize;
        accumulator.fiber += item.meal.totalFiber * item.portionSize;
        return accumulator;
      },
      { calories: 0, protein: 0, fat: 0, fiber: 0 },
    );

    return {
      calories: this.roundTo2(totals.calories),
      protein: this.roundTo2(totals.protein),
      fat: this.roundTo2(totals.fat),
      fiber: this.roundTo2(totals.fiber),
    };
  }

  private mapTemplateItemsByMealTime(
    items: Array<{
      id: string;
      mealId: number;
      mealTime: MealTime;
      portionSize: number;
      meal: {
        name: string;
        totalCalories: number;
        totalProtein: number;
        totalFat: number;
        totalFiber: number;
      };
    }>,
    mealTime: MealTime,
  ): MealTemplateItemResponse[] {
    return items
      .filter((item) => item.mealTime === mealTime)
      .map((item) => ({
        itemId: item.id,
        mealId: item.mealId,
        mealName: item.meal.name,
        portionSize: item.portionSize,
        nutritionPerServing: this.buildNutritionFromMeal(item.meal),
      }));
  }

  private addDaysToDateString(dateString: string, dayOffset: number) {
    const [year, month, day] = dateString.split('-').map(Number);
    const utcDate = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
    utcDate.setUTCDate(utcDate.getUTCDate() + dayOffset);

    const nextYear = utcDate.getUTCFullYear();
    const nextMonth = `${utcDate.getUTCMonth() + 1}`.padStart(2, '0');
    const nextDay = `${utcDate.getUTCDate()}`.padStart(2, '0');
    return `${nextYear}-${nextMonth}-${nextDay}`;
  }

  private toBusinessDayStartUtc(date: string) {
    return new Date(`${date}T00:00:00.000+07:00`);
  }

  private isUniqueConstraintError(error: unknown) {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const value = error as { code?: unknown };
    return value.code === 'P2002';
  }

  private async recalculateAndPersistMenuTotals(tx: any, menuId: number) {
    const items = await tx.menuItem.findMany({
      where: { menuId },
      include: {
        meal: {
          select: {
            totalCalories: true,
            totalProtein: true,
            totalFat: true,
            totalFiber: true,
          },
        },
      },
    });

    const totals = items.reduce(
      (accumulator: { calories: number; protein: number; fat: number; fiber: number }, item: any) => {
        accumulator.calories += item.meal.totalCalories * item.portionSize;
        accumulator.protein += item.meal.totalProtein * item.portionSize;
        accumulator.fat += item.meal.totalFat * item.portionSize;
        accumulator.fiber += item.meal.totalFiber * item.portionSize;
        return accumulator;
      },
      { calories: 0, protein: 0, fat: 0, fiber: 0 },
    );

    await tx.menu.update({
      where: { id: menuId },
      data: {
        totalCalories: this.roundTo2(totals.calories),
        totalProtein: this.roundTo2(totals.protein),
        totalFat: this.roundTo2(totals.fat),
        totalFiber: this.roundTo2(totals.fiber),
      },
    });
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
        days: {
          include: {
            items: {
              include: {
                meal: {
                  select: {
                    totalCalories: true,
                    totalProtein: true,
                    totalFat: true,
                    totalFiber: true,
                  },
                },
              },
            },
          },
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
        nutritionTotal: this.sumItemNutrition(t.days.flatMap((day) => day.items)),
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

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      nutritionTotal: this.sumItemNutrition(template.days.flatMap((day) => day.items)),
      days: template.days.map((day) => ({
        dayNumber: day.dayNumber,
        nutritionTotal: this.sumItemNutrition(day.items),
        meals: {
          BREAKFAST: this.mapTemplateItemsByMealTime(day.items, 'BREAKFAST'),
          LUNCH: this.mapTemplateItemsByMealTime(day.items, 'LUNCH'),
          DINNER: this.mapTemplateItemsByMealTime(day.items, 'DINNER'),
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

  async applyTemplate(
    userId: string,
    templateId: string,
    data: ApplyMealTemplateRequest,
  ): Promise<ApplyMealTemplateResponse> {
    await this.checkOwnership(templateId, userId);

    const template = await this.prisma.mealTemplate.findUnique({
      where: { id: templateId },
      include: {
        days: {
          include: {
            items: {
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { dayNumber: 'asc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Meal template not found.');
    }

    if (template.days.length === 0) {
      throw new UnprocessableEntityException('Template has no days to apply.');
    }

    const maxDayNumber = template.days.reduce(
      (currentMax, day) => Math.max(currentMax, day.dayNumber),
      0,
    );

    const counters = await this.prisma.$transaction(async (tx) => {
      const result = {
        createdMenuCount: 0,
        updatedMenuCount: 0,
        deletedMenuCount: 0,
        createdItemCount: 0,
        skippedExistingItemCount: 0,
      };

      for (const day of template.days) {
        const targetDate = this.addDaysToDateString(data.startDate, day.dayNumber - 1);
        const menuDate = this.toBusinessDayStartUtc(targetDate);
        const nextItems = day.items.map((item) => ({
          mealId: item.mealId,
          mealTime: item.mealTime,
          portionSize: item.portionSize,
          eated: false,
        }));

        let menu = await tx.menu.findFirst({
          where: { userId, date: menuDate },
          select: { id: true },
        });
        const hadExistingMenu = Boolean(menu);

        if (data.replaceExistingMeals) {
          if (nextItems.length === 0) {
            if (menu) {
              await tx.menuItem.deleteMany({ where: { menuId: menu.id } });
              await tx.menu.delete({ where: { id: menu.id } });
              result.deletedMenuCount += 1;
            }
            continue;
          }

          if (!menu) {
            menu = await tx.menu.create({
              data: {
                userId,
                date: menuDate,
                totalCalories: 0,
                totalProtein: 0,
                totalFat: 0,
                totalFiber: 0,
              },
              select: { id: true },
            });
            result.createdMenuCount += 1;
          } else {
            await tx.menuItem.deleteMany({ where: { menuId: menu.id } });
            result.updatedMenuCount += 1;
          }

          if (!menu) {
            throw new UnprocessableEntityException('Unable to resolve target menu for template apply.');
          }

          const replaceTargetMenuId = menu.id;

          await tx.menuItem.createMany({
            data: nextItems.map((item) => ({
              menuId: replaceTargetMenuId,
              mealId: item.mealId,
              mealTime: item.mealTime,
              portionSize: item.portionSize,
              eated: item.eated,
            })),
          });
          result.createdItemCount += nextItems.length;
          await this.recalculateAndPersistMenuTotals(tx, replaceTargetMenuId);
          continue;
        }

        if (nextItems.length === 0) {
          continue;
        }

        if (!menu) {
          try {
            menu = await tx.menu.create({
              data: {
                userId,
                date: menuDate,
                totalCalories: 0,
                totalProtein: 0,
                totalFat: 0,
                totalFiber: 0,
              },
              select: { id: true },
            });
            result.createdMenuCount += 1;
          } catch (error) {
            if (!this.isUniqueConstraintError(error)) {
              throw error;
            }

            menu = await tx.menu.findFirst({
              where: { userId, date: menuDate },
              select: { id: true },
            });

            if (!menu) {
              throw error;
            }
          }
        }

        if (!menu) {
          throw new UnprocessableEntityException('Unable to resolve target menu for template apply.');
        }

        const mergeTargetMenuId = menu.id;

        const created = await tx.menuItem.createMany({
          data: nextItems.map((item) => ({
            menuId: mergeTargetMenuId,
            mealId: item.mealId,
            mealTime: item.mealTime,
            portionSize: item.portionSize,
            eated: item.eated,
          })),
          skipDuplicates: true,
        });

        result.createdItemCount += created.count;
        result.skippedExistingItemCount += nextItems.length - created.count;

        if (created.count > 0) {
          if (hadExistingMenu) {
            result.updatedMenuCount += 1;
          }
          await this.recalculateAndPersistMenuTotals(tx, mergeTargetMenuId);
        }
      }

      return result;
    });

    return {
      templateId,
      startDate: data.startDate,
      endDate: this.addDaysToDateString(data.startDate, maxDayNumber - 1),
      appliedDayCount: template.days.length,
      replaceExistingMeals: data.replaceExistingMeals,
      createdMenuCount: counters.createdMenuCount,
      updatedMenuCount: counters.updatedMenuCount,
      deletedMenuCount: counters.deletedMenuCount,
      createdItemCount: counters.createdItemCount,
      skippedExistingItemCount: counters.skippedExistingItemCount,
    };
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
      nutritionPerServing: this.buildNutritionFromMeal(updated.meal),
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
