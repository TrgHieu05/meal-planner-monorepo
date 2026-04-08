/// <reference types="jest" />

import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { MenuService } from './menu.service';

describe('MenuService', () => {
  let service: MenuService;
  let prisma: {
    menu: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    meal: { findUnique: jest.Mock };
    menuItem: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
      count: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    prisma = {
      menu: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      meal: {
        findUnique: jest.fn(),
      },
      menuItem: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    service = new MenuService(prisma as unknown as PrismaService);
  });

  describe('getMenuByDay', () => {
    it('should return empty day response when no menu exists', async () => {
      prisma.menu.findFirst.mockResolvedValue(null);

      const result = await service.getMenuByDay(userId, '2026-03-24');

      expect(result).toEqual({
        date: '2026-03-24',
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
      });
    });

    it('should throw InternalServerErrorException when menu item data is invalid', async () => {
      prisma.menu.findFirst.mockResolvedValue({
        id: 1,
        userId,
        date: new Date('2026-03-24T00:00:00.000Z'),
        totalCalories: 0,
        totalProtein: 0,
        totalFat: 0,
        totalFiber: 0,
        items: [
          {
            id: 1,
            menuId: 1,
            mealId: 2,
            mealTime: 'BREAKFAST',
            eated: 'false',
            portionSize: 1,
          },
        ],
      });

      await expect(service.getMenuByDay(userId, '2026-03-24')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('createMenuItem', () => {
    it('should normalize date to Asia/Ho_Chi_Minh business-day start', async () => {
      const tx = {
        meal: {
          findUnique: jest.fn().mockResolvedValue({ id: 10 }),
        },
        menu: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 100 }),
          update: jest.fn().mockResolvedValue({ id: 100 }),
        },
        menuItem: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({
            id: 11,
            menuId: 100,
            mealId: 10,
            mealTime: 'BREAKFAST',
            eated: false,
            portionSize: 1,
          }),
          findMany: jest.fn().mockResolvedValue([]),
        },
      };

      prisma.$transaction.mockImplementation(async (handler) => handler(tx));

      await service.createMenuItem(userId, {
        date: '2026-03-24',
        mealId: 10,
        mealTime: 'BREAKFAST',
        portionSize: 1,
      });

      const createCall = tx.menu.create.mock.calls[0][0] as {
        data: { date: Date };
      };
      expect(createCall.data.date.toISOString()).toBe('2026-03-23T17:00:00.000Z');
    });

    it('should create menu and menu item in transaction and update rounded totals', async () => {
      const tx = {
        meal: {
          findUnique: jest.fn().mockResolvedValue({ id: 10 }),
        },
        menu: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({ id: 100 }),
          update: jest.fn().mockResolvedValue({ id: 100 }),
        },
        menuItem: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn().mockResolvedValue({
            id: 11,
            menuId: 100,
            mealId: 10,
            mealTime: 'BREAKFAST',
            eated: false,
            portionSize: 1.5,
          }),
          findMany: jest.fn().mockResolvedValue([
            {
              menuId: 100,
              mealId: 10,
              mealTime: 'BREAKFAST',
              eated: false,
              portionSize: 1.5,
              meal: {
                totalCalories: 123.456,
                totalProtein: 10.111,
                totalFat: 6.222,
                totalFiber: 2.333,
              },
            },
          ]),
        },
      };

      prisma.$transaction.mockImplementation(async (handler) => handler(tx));

      const result = await service.createMenuItem(userId, {
        date: '2026-03-24',
        mealId: 10,
        mealTime: 'BREAKFAST',
        portionSize: 1.5,
      });

      expect(tx.menu.create).toHaveBeenCalledWith({
        data: {
          userId,
          date: new Date('2026-03-23T17:00:00.000Z'),
          totalCalories: 0,
          totalProtein: 0,
          totalFat: 0,
          totalFiber: 0,
        },
      });

      expect(tx.menu.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: {
          totalCalories: 185.18,
          totalProtein: 15.17,
          totalFat: 9.33,
          totalFiber: 3.5,
        },
      });

      expect(result).toEqual({
        id: 11,
        menuId: 100,
        mealId: 10,
        mealTime: 'BREAKFAST',
        eated: false,
        portionSize: 1.5,
      });
    });

    it('should throw NotFoundException when meal does not exist', async () => {
      const tx = {
        meal: {
          findUnique: jest.fn().mockResolvedValue(null),
        },
      };

      prisma.$transaction.mockImplementation(async (handler) => handler(tx));

      await expect(
        service.createMenuItem(userId, {
          date: '2026-03-24',
          mealId: 999,
          mealTime: 'BREAKFAST',
          portionSize: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when duplicated meal exists in same day and mealTime', async () => {
      const tx = {
        meal: {
          findUnique: jest.fn().mockResolvedValue({ id: 10 }),
        },
        menu: {
          findFirst: jest.fn().mockResolvedValue({ id: 100 }),
        },
        menuItem: {
          findFirst: jest.fn().mockResolvedValue({ id: 99 }),
        },
      };

      prisma.$transaction.mockImplementation(async (handler) => handler(tx));

      await expect(
        service.createMenuItem(userId, {
          date: '2026-03-24',
          mealId: 10,
          mealTime: 'BREAKFAST',
          portionSize: 1,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deleteMenuByDay', () => {
    it('should be idempotent when no menu exists for the day', async () => {
      const tx = {
        menu: {
          findFirst: jest.fn().mockResolvedValue(null),
          delete: jest.fn(),
        },
        menuItem: {
          deleteMany: jest.fn(),
        },
      };
      prisma.$transaction.mockImplementation(async (handler) => handler(tx));

      await service.deleteMenuByDay(userId, '2026-03-24');

      expect(tx.menu.findFirst).toHaveBeenCalledWith({
        where: {
          userId,
          date: new Date('2026-03-23T17:00:00.000Z'),
        },
        select: { id: true },
      });
      expect(tx.menuItem.deleteMany).not.toHaveBeenCalled();
      expect(tx.menu.delete).not.toHaveBeenCalled();
    });

    it('should delete all menu items and then delete menu when menu exists', async () => {
      const tx = {
        menu: {
          findFirst: jest.fn().mockResolvedValue({ id: 100 }),
          delete: jest.fn().mockResolvedValue({ id: 100 }),
        },
        menuItem: {
          deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
        },
      };
      prisma.$transaction.mockImplementation(async (handler) => handler(tx));

      await service.deleteMenuByDay(userId, '2026-03-24');

      expect(tx.menuItem.deleteMany).toHaveBeenCalledWith({
        where: { menuId: 100 },
      });
      expect(tx.menu.delete).toHaveBeenCalledWith({
        where: { id: 100 },
      });
    });
  });

  describe('updateMenuItem', () => {
    it('should throw NotFoundException when menu item is not owned by current user', async () => {
      const tx = {
        menuItem: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };
      prisma.$transaction.mockImplementation(async (handler) => handler(tx));

      await expect(
        service.updateMenuItem(userId, 99, { portionSize: 2 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update menu item and recalculate totals', async () => {
      const tx = {
        menuItem: {
          findFirst: jest.fn().mockResolvedValue({ id: 11, menuId: 100 }),
          update: jest.fn().mockResolvedValue({
            id: 11,
            menuId: 100,
            mealId: 10,
            mealTime: 'BREAKFAST',
            eated: true,
            portionSize: 2,
          }),
          findMany: jest.fn().mockResolvedValue([
            {
              portionSize: 2,
              meal: {
                totalCalories: 100,
                totalProtein: 8,
                totalFat: 4,
                totalFiber: 2,
              },
            },
          ]),
        },
        menu: {
          update: jest.fn().mockResolvedValue({ id: 100 }),
        },
      };
      prisma.$transaction.mockImplementation(async (handler) => handler(tx));

      const result = await service.updateMenuItem(userId, 11, {
        portionSize: 2,
        eated: true,
      });

      expect(tx.menuItem.update).toHaveBeenCalledWith({
        where: { id: 11 },
        data: {
          portionSize: 2,
          eated: true,
        },
      });
      expect(tx.menu.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: {
          totalCalories: 200,
          totalProtein: 16,
          totalFat: 8,
          totalFiber: 4,
        },
      });
      expect(result).toEqual({
        id: 11,
        menuId: 100,
        mealId: 10,
        mealTime: 'BREAKFAST',
        eated: true,
        portionSize: 2,
      });
    });
  });

  describe('deleteMenuItem', () => {
    it('should throw NotFoundException when menu item is not owned by current user', async () => {
      const tx = {
        menuItem: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      };
      prisma.$transaction.mockImplementation(async (handler) => handler(tx));

      await expect(service.deleteMenuItem(userId, 999)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should delete menu when deleting the last item', async () => {
      const tx = {
        menuItem: {
          findFirst: jest.fn().mockResolvedValue({ id: 11, menuId: 100 }),
          delete: jest.fn().mockResolvedValue({ id: 11 }),
          count: jest.fn().mockResolvedValue(0),
        },
        menu: {
          delete: jest.fn().mockResolvedValue({ id: 100 }),
        },
      };
      prisma.$transaction.mockImplementation(async (handler) => handler(tx));

      await service.deleteMenuItem(userId, 11);

      expect(tx.menu.delete).toHaveBeenCalledWith({
        where: { id: 100 },
      });
    });

    it('should recalculate totals when menu still has remaining items', async () => {
      const tx = {
        menuItem: {
          findFirst: jest.fn().mockResolvedValue({ id: 11, menuId: 100 }),
          delete: jest.fn().mockResolvedValue({ id: 11 }),
          count: jest.fn().mockResolvedValue(1),
          findMany: jest.fn().mockResolvedValue([
            {
              portionSize: 1,
              meal: {
                totalCalories: 320.123,
                totalProtein: 20.555,
                totalFat: 10.222,
                totalFiber: 4.333,
              },
            },
          ]),
        },
        menu: {
          update: jest.fn().mockResolvedValue({ id: 100 }),
          delete: jest.fn(),
        },
      };
      prisma.$transaction.mockImplementation(async (handler) => handler(tx));

      await service.deleteMenuItem(userId, 11);

      expect(tx.menu.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: {
          totalCalories: 320.12,
          totalProtein: 20.56,
          totalFat: 10.22,
          totalFiber: 4.33,
        },
      });
      expect(tx.menu.delete).not.toHaveBeenCalled();
    });
  });
});
