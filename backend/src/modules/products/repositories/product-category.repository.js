import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export @Injectable()
class ProductCategoryRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  findAllGroupsWithCategories({ includeInactive = false } = {}) {
    return this.prisma.productCategoryGroup.findMany({
      where: includeInactive ? undefined : { is_active: true },
      orderBy: { sort_order: 'asc' },
      include: {
        categories: {
          where: includeInactive ? undefined : { is_active: true },
          orderBy: { sort_order: 'asc' },
        },
      },
    });
  }

  findGroupByCode(code) {
    return this.prisma.productCategoryGroup.findUnique({
      where: { code },
      include: {
        categories: {
          orderBy: { sort_order: 'asc' },
        },
      },
    });
  }

  upsertGroup(group) {
    return this.prisma.productCategoryGroup.upsert({
      where: { code: group.code },
      create: {
        code: group.code,
        name: group.name,
        description: group.description ?? null,
        sort_order: group.sort_order ?? 0,
        is_active: group.is_active ?? true,
      },
      update: {
        name: group.name,
        description: group.description ?? null,
        sort_order: group.sort_order ?? 0,
        is_active: group.is_active ?? true,
      },
    });
  }

  upsertCategory(groupId, category) {
    return this.prisma.productCategory.upsert({
      where: { slug: category.slug },
      create: {
        group_id: groupId,
        slug: category.slug,
        name: category.name,
        sort_order: category.sort_order ?? 0,
        is_active: category.is_active ?? true,
      },
      update: {
        group_id: groupId,
        name: category.name,
        sort_order: category.sort_order ?? 0,
        is_active: category.is_active ?? true,
      },
    });
  }

  countGroups() {
    return this.prisma.productCategoryGroup.count();
  }
}
