import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProductCategoryRepository } from '../repositories/product-category.repository';
import { PRODUCT_CATEGORY_GROUP_SEED } from '../constants/product-category.seed';

export @Injectable()
class ProductCategoryService {
  constructor(@Inject(ProductCategoryRepository) productCategoryRepository) {
    this.productCategoryRepository = productCategoryRepository;
    this.logger = new Logger(ProductCategoryService.name);
  }

  async findAll({ includeInactive = false } = {}) {
    const groups = await this.productCategoryRepository.findAllGroupsWithCategories({
      includeInactive,
    });

    return {
      groups: groups.map((group) => this.formatGroup(group)),
    };
  }

  async findGroupByCode(code) {
    const group = await this.productCategoryRepository.findGroupByCode(code);

    if (!group) {
      throw new NotFoundException(`Category group '${code}' not found`);
    }

    return this.formatGroup(group);
  }

  async seedCatalogCategories() {
    let groupsSeeded = 0;
    let categoriesSeeded = 0;

    for (const groupSeed of PRODUCT_CATEGORY_GROUP_SEED) {
      const group = await this.productCategoryRepository.upsertGroup(groupSeed);
      groupsSeeded += 1;

      for (const categorySeed of groupSeed.categories || []) {
        await this.productCategoryRepository.upsertCategory(group.id, categorySeed);
        categoriesSeeded += 1;
      }
    }

    this.logger.log(
      `Product categories seeded | groups=${groupsSeeded} categories=${categoriesSeeded}`,
    );

    return {
      message: 'Product categories seeded successfully',
      groupsSeeded,
      categoriesSeeded,
    };
  }

  formatGroup(group) {
    return {
      id: group.id,
      code: group.code,
      name: group.name,
      description: group.description,
      sortOrder: group.sort_order,
      isActive: group.is_active,
      categories: (group.categories || []).map((category) => this.formatCategory(category)),
      createdAt: group.created_at,
      updatedAt: group.updated_at,
    };
  }

  formatCategory(category) {
    return {
      id: category.id,
      groupId: category.group_id,
      slug: category.slug,
      name: category.name,
      sortOrder: category.sort_order,
      isActive: category.is_active,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    };
  }
}
