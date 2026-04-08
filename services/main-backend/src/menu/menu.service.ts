import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  MenuItemCreate,
  MenuItemUpdate,
  MenuResponse,
  MenuItem,
  MenuItemSchema,
  MenuResponseSchema,
} from '@meal/shared';
import { Uuid } from '@meal/shared/types/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  async getMenuByDay(userId: Uuid, date: string): Promise<MenuResponse> {
    const menuDate = this.toBusinessDayStartUtc(date);

    const menu = await this.prisma.menu.findFirst({
      where: { userId, date: menuDate },
      include: {
        items: {
          orderBy: { id: 'asc' },
        },
      },
    });

    const emptyResponse: MenuResponse = {
      date,
      hasMenu: false,
      nutritionTotal: {
        calories: 0,
        protein: 0,
        fat: 0,
        fiber: 0,
      },
      meals: {
        BREAKFAST: [],
        LUNCH: [],
        DINNER: [],
      },
    };

    if (!menu) {
      return emptyResponse;
    }

    const meals = {
      BREAKFAST: [] as MenuItem[],
      LUNCH: [] as MenuItem[],
      DINNER: [] as MenuItem[],
    };

    for (const item of menu.items) {
      const parsedItem = MenuItemSchema.safeParse(item);
      if (!parsedItem.success) {
        throw new InternalServerErrorException('Invalid menu item data.');
      }
      meals[parsedItem.data.mealTime].push(parsedItem.data);
    }

    const response: MenuResponse = {
      date,
      hasMenu: menu.items.length > 0,
      nutritionTotal: {
        calories: this.roundTo2(menu.totalCalories),
        protein: this.roundTo2(menu.totalProtein),
        fat: this.roundTo2(menu.totalFat),
        fiber: this.roundTo2(menu.totalFiber),
      },
      meals,
    };

    const parsedResponse = MenuResponseSchema.safeParse(response);
    if (!parsedResponse.success) {
      throw new InternalServerErrorException('Invalid menu day response data.');
    }

    return parsedResponse.data;
  }

  async deleteMenuByDay(userId: Uuid, date: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const menu = await tx.menu.findFirst({
        where: {
          userId,
          date: this.toBusinessDayStartUtc(date),
        },
        select: { id: true },
      });

      if (!menu) {
        return;
      }

      await tx.menuItem.deleteMany({
        where: { menuId: menu.id },
      });

      await tx.menu.delete({
        where: { id: menu.id },
      });
    });
  }

  async createMenuItem(userId: Uuid, payload: MenuItemCreate): Promise<MenuItem> {
    const created = await this.prisma.$transaction(async (tx) => {
      const meal = await tx.meal.findUnique({
        where: { id: payload.mealId },
        select: {
          id: true,
        },
      });

      if (!meal) {
        throw new NotFoundException('Meal not found.');
      }

      const menuDate = this.toBusinessDayStartUtc(payload.date);
      let menu = await tx.menu.findFirst({
        where: {
          userId,
          date: menuDate,
        },
      });

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
        });
      }

      const existingItem = await tx.menuItem.findFirst({
        where: {
          menuId: menu.id,
          mealId: payload.mealId,
          mealTime: payload.mealTime,
        },
        select: { id: true },
      });

      if (existingItem) {
        throw new ConflictException(
          'Menu item already exists for the selected meal and meal time.',
        );
      }

      const createdItem = await tx.menuItem.create({
        data: {
          menuId: menu.id,
          mealId: payload.mealId,
          mealTime: payload.mealTime,
          portionSize: payload.portionSize,
          eated: false,
        },
      });

      const items = await tx.menuItem.findMany({
        where: { menuId: menu.id },
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
        (acc, item) => {
          acc.calories += item.meal.totalCalories * item.portionSize;
          acc.protein += item.meal.totalProtein * item.portionSize;
          acc.fat += item.meal.totalFat * item.portionSize;
          acc.fiber += item.meal.totalFiber * item.portionSize;
          return acc;
        },
        { calories: 0, protein: 0, fat: 0, fiber: 0 },
      );

      await tx.menu.update({
        where: { id: menu.id },
        data: {
          totalCalories: this.roundTo2(totals.calories),
          totalProtein: this.roundTo2(totals.protein),
          totalFat: this.roundTo2(totals.fat),
          totalFiber: this.roundTo2(totals.fiber),
        },
      });

      return createdItem;
    });

    const parsed = MenuItemSchema.safeParse(created);
    if (!parsed.success) {
      throw new InternalServerErrorException('Invalid created menu item data.');
    }

    return parsed.data;
  }

  async updateMenuItem(
    userId: Uuid,
    id: number,
    payload: MenuItemUpdate,
  ): Promise<MenuItem> {
    const updated = await this.prisma.$transaction(async (tx) => {
      const ownedItem = await tx.menuItem.findFirst({
        where: {
          id,
          menu: {
            userId,
          },
        },
        select: {
          id: true,
          menuId: true,
        },
      });

      if (!ownedItem) {
        throw new NotFoundException('Menu item not found.');
      }

      const nextItem = await tx.menuItem.update({
        where: { id: ownedItem.id },
        data: payload,
      });

      await this.recalculateAndPersistMenuTotals(tx, ownedItem.menuId);

      return nextItem;
    });

    const parsed = MenuItemSchema.safeParse(updated);
    if (!parsed.success) {
      throw new InternalServerErrorException('Invalid updated menu item data.');
    }

    return parsed.data;
  }

  async deleteMenuItem(userId: Uuid, id: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const ownedItem = await tx.menuItem.findFirst({
        where: {
          id,
          menu: {
            userId,
          },
        },
        select: {
          id: true,
          menuId: true,
        },
      });

      if (!ownedItem) {
        throw new NotFoundException('Menu item not found.');
      }

      await tx.menuItem.delete({
        where: { id: ownedItem.id },
      });

      const remainingItemCount = await tx.menuItem.count({
        where: { menuId: ownedItem.menuId },
      });

      if (remainingItemCount === 0) {
        await tx.menu.delete({
          where: { id: ownedItem.menuId },
        });
        return;
      }

      await this.recalculateAndPersistMenuTotals(tx, ownedItem.menuId);
    });
  }

  private roundTo2(value: number) {
    return Math.round(value * 100) / 100;
  }

  // Normalizes a date-only string to the business-day start instant in Asia/Ho_Chi_Minh.
  private toBusinessDayStartUtc(date: string) {
    return new Date(`${date}T00:00:00.000+07:00`);
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
      (acc, item) => {
        acc.calories += item.meal.totalCalories * item.portionSize;
        acc.protein += item.meal.totalProtein * item.portionSize;
        acc.fat += item.meal.totalFat * item.portionSize;
        acc.fiber += item.meal.totalFiber * item.portionSize;
        return acc;
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
}
