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
        { id: '1', name: 'T1', description: 'D1', _count: { days: 3 } },
      ]);
      const res = await service.getTemplates('user1');
      expect(res.list).toHaveLength(1);
      expect(res.list[0]?.dayCount).toBe(3);
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
});
