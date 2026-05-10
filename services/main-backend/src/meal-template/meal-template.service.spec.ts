import { NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { MealTemplateService } from './meal-template.service';
import { PrismaService } from '../database/prisma.service';

describe('MealTemplateService', () => {
  let service: MealTemplateService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      mealTemplate: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      mealTemplateDay: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      mealTemplateDayItem: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
      },
      menu: {
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),
      },
      meal: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };
    service = new MealTemplateService(prisma as unknown as PrismaService);
  });

  describe('Core Template Operations', () => {
    it('should throw NotFound if template not found', async () => {
      prisma.mealTemplate.findUnique.mockResolvedValue(null);
      await expect(service.getTemplateDetail('user1', 'temp1')).rejects.toThrow(NotFoundException);
    });

    it('should throw Forbidden if template does not belong to user', async () => {
      prisma.mealTemplate.findUnique.mockResolvedValue({ userId: 'other-user' });
      await expect(service.getTemplateDetail('user1', 'temp1')).rejects.toThrow(ForbiddenException);
    });

    it('should return template list', async () => {
      prisma.mealTemplate.findMany.mockResolvedValue([
        {
          id: '1',
          name: 'T1',
          description: 'D1',
          _count: { days: 3 },
          days: [
            {
              items: [
                {
                  portionSize: 1.5,
                  meal: {
                    totalCalories: 100,
                    totalProtein: 10,
                    totalFat: 5,
                    totalFiber: 2,
                  },
                },
              ],
            },
          ],
        },
      ]);
      const res = await service.getTemplates('user1');
      expect(res.list).toHaveLength(1);
      expect(res.list[0]?.dayCount).toBe(3);
      expect(res.list[0]?.nutritionTotal).toEqual({
        calories: 150,
        protein: 15,
        fat: 7.5,
        fiber: 3,
      });
    });

    it('should map template detail with nutrition data', async () => {
      prisma.mealTemplate.findUnique
        .mockResolvedValueOnce({ userId: 'user1' })
        .mockResolvedValueOnce({
          id: 'temp1',
          name: 'Template 1',
          description: 'Desc',
          days: [
            {
              dayNumber: 1,
              items: [
                {
                  id: 'item1',
                  mealId: 10,
                  mealTime: 'BREAKFAST',
                  portionSize: 2,
                  meal: {
                    name: 'Meal 1',
                    totalCalories: 123.45,
                    totalProtein: 10,
                    totalFat: 6,
                    totalFiber: 4,
                  },
                },
              ],
            },
          ],
        });

      const result = await service.getTemplateDetail('user1', 'temp1');

      expect(result.nutritionTotal).toEqual({
        calories: 246.9,
        protein: 20,
        fat: 12,
        fiber: 8,
      });
      expect(result.days[0]?.nutritionTotal).toEqual({
        calories: 246.9,
        protein: 20,
        fat: 12,
        fiber: 8,
      });
      expect(result.days[0]?.meals.BREAKFAST[0]?.nutritionPerServing).toEqual({
        calories: 123.45,
        protein: 10,
        fat: 6,
        fiber: 4,
      });
    });
  });

  describe('Item Operations', () => {
    it('should throw ConflictException if mealId already exists in same mealTime and day', async () => {
      // Mock checkOwnership
      prisma.mealTemplate.findUnique.mockResolvedValue({ userId: 'user1' });
      // Mock meal exists
      prisma.meal.findUnique.mockResolvedValue({ id: 10 });
      // Mock day exists
      prisma.mealTemplateDay.findUnique.mockResolvedValue({ id: 'day1' });
      // Mock existing item
      prisma.mealTemplateDayItem.findFirst.mockResolvedValue({ id: 'item1' });

      await expect(
        service.addItem('user1', 'temp1', {
          dayNumber: 1,
          mealId: 10,
          mealTime: 'BREAKFAST',
          portionSize: 1,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('upsertDay should throw Conflict if payload has duplicates', async () => {
      prisma.mealTemplate.findUnique.mockResolvedValue({ userId: 'user1' });
      prisma.mealTemplateDay.findUnique.mockResolvedValue({ id: 'day1' });
      
      await expect(
        service.upsertDay('user1', 'temp1', 1, {
          meals: {
            BREAKFAST: [
              { mealId: 10, portionSize: 1 },
              { mealId: 10, portionSize: 2 },
            ],
          },
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Apply Operations', () => {
    it('should merge template items into existing menus and skip duplicates when replaceExistingMeals is false', async () => {
      prisma.mealTemplate.findUnique
        .mockResolvedValueOnce({ userId: 'user1' })
        .mockResolvedValueOnce({
          id: 'temp1',
          days: [
            {
              dayNumber: 1,
              items: [
                { mealId: 10, mealTime: 'BREAKFAST', portionSize: 1 },
                { mealId: 11, mealTime: 'BREAKFAST', portionSize: 1 },
              ],
            },
          ],
        });
      prisma.menu.findFirst.mockResolvedValue({ id: 99 });
      prisma.mealTemplateDayItem.createMany.mockReset();
      prisma.mealTemplateDayItem.findMany.mockReset();
      prisma.menuItem = {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        findMany: jest.fn().mockResolvedValue([
          {
            portionSize: 1,
            meal: {
              totalCalories: 200,
              totalProtein: 20,
              totalFat: 10,
              totalFiber: 5,
            },
          },
        ]),
        deleteMany: jest.fn(),
      };

      const result = await service.applyTemplate('user1', 'temp1', {
        startDate: '2026-05-10',
        replaceExistingMeals: false,
      });

      expect(result).toMatchObject({
        templateId: 'temp1',
        startDate: '2026-05-10',
        endDate: '2026-05-10',
        appliedDayCount: 1,
        replaceExistingMeals: false,
        createdMenuCount: 0,
        updatedMenuCount: 1,
        deletedMenuCount: 0,
        createdItemCount: 1,
        skippedExistingItemCount: 1,
      });
      expect(prisma.menu.update).toHaveBeenCalledWith({
        where: { id: 99 },
        data: {
          totalCalories: 200,
          totalProtein: 20,
          totalFat: 10,
          totalFiber: 5,
        },
      });
    });
  });
});
