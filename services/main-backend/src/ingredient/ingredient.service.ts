import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  IngredientCatalogQuery,
  IngredientCatalogResponseSchema,
} from '@meal/shared/types/ingredient';

@Injectable()
export class IngredientService {
  constructor(private readonly prisma: PrismaService) {}

  async getCatalog(query: IngredientCatalogQuery) {
    const { page, pageSize, q } = query;
    const skip = (page - 1) * pageSize;
    const where = q
      ? {
          name: {
            contains: q,
            mode: 'insensitive' as const,
          },
        }
      : undefined;

    const [items, total] = await Promise.all([
      this.prisma.ingredient.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
        },
      }),
      this.prisma.ingredient.count({ where }),
    ]);

    const response = {
      items,
      page,
      pageSize,
      total,
      hasMore: skip + items.length < total,
    };
    const parsed = IngredientCatalogResponseSchema.safeParse(response);
    if (!parsed.success) {
      throw new InternalServerErrorException('Invalid ingredient catalog data');
    }

    return parsed.data;
  }
}