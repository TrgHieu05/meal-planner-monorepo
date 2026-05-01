import { InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { IngredientService } from './ingredient.service';

describe('IngredientService', () => {
  let service: IngredientService;
  let prisma: {
    ingredient: {
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      ingredient: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    service = new IngredientService(prisma as unknown as PrismaService);
  });

  it('should return paginated ingredient catalog', async () => {
    prisma.ingredient.findMany.mockResolvedValue([
      { id: 1, name: 'Egg' },
      { id: 2, name: 'Milk' },
    ]);
    prisma.ingredient.count.mockResolvedValue(31);

    const result = await service.getCatalog({ q: '', page: 1, pageSize: 30 });

    expect(prisma.ingredient.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: { name: 'asc' },
      skip: 0,
      take: 30,
      select: {
        id: true,
        name: true,
      },
    });
    expect(prisma.ingredient.count).toHaveBeenCalledWith({ where: undefined });
    expect(result).toEqual({
      items: [
        { id: 1, name: 'Egg' },
        { id: 2, name: 'Milk' },
      ],
      page: 1,
      pageSize: 30,
      total: 31,
      hasMore: true,
    });
  });

  it('should apply search filter and pagination offset', async () => {
    prisma.ingredient.findMany.mockResolvedValue([{ id: 31, name: 'Eggplant' }]);
    prisma.ingredient.count.mockResolvedValue(31);

    const result = await service.getCatalog({ q: 'egg', page: 2, pageSize: 30 });

    expect(prisma.ingredient.findMany).toHaveBeenCalledWith({
      where: {
        name: {
          contains: 'egg',
          mode: 'insensitive',
        },
      },
      orderBy: { name: 'asc' },
      skip: 30,
      take: 30,
      select: {
        id: true,
        name: true,
      },
    });
    expect(result.hasMore).toBe(false);
  });

  it('should throw when ingredient catalog shape is invalid', async () => {
    prisma.ingredient.findMany.mockResolvedValue([{ id: 1, name: 123 }]);
    prisma.ingredient.count.mockResolvedValue(1);

    await expect(
      service.getCatalog({ q: '', page: 1, pageSize: 30 }),
    ).rejects.toThrow(InternalServerErrorException);
  });
});