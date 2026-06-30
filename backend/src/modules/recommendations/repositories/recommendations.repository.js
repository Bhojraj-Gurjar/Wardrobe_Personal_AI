import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

const PRODUCT_INCLUDE = {
  images: { orderBy: { sort_order: 'asc' } },
};

export @Injectable()
class RecommendationsRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
    this.logger = new Logger(RecommendationsRepository.name);
  }

  async findClosetItemsWithProducts(userId) {
    try {
      const items = await this.prisma.personalClosetItem.findMany({
        where: { user_id: userId, is_removed: false },
        take: 20,
        orderBy: { created_at: 'desc' },
      });

      if (!items.length) {
        return [];
      }

      const productIds = [...new Set(items.map((item) => item.product_id).filter(Boolean))];

      if (!productIds.length) {
        return [];
      }

      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        include: PRODUCT_INCLUDE,
      });
      const productMap = new Map(products.map((product) => [product.id, product]));

      return items
        .map((item) => ({
          ...item,
          product: productMap.get(item.product_id) || null,
        }))
        .filter((item) => item.product);
    } catch (error) {
      this.logger.warn(
        `Failed to load personal closet items for recommendations: ${error?.message || error}`,
      );
      return [];
    }
  }

  async getUserSignals(userId) {
    const activitySince = new Date();
    activitySince.setDate(activitySince.getDate() - 90);

    const [
      profile,
      fashionDna,
      wishlistItems,
      orders,
      faceAnalysis,
      bodyAnalysis,
      closetItems,
      searchHistory,
      productViews,
    ] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { user_id: userId } }),
      this.prisma.fashionDna.findUnique({ where: { user_id: userId } }),
      this.prisma.wishlist.findMany({
        where: { user_id: userId },
        include: { product: { include: { images: { orderBy: { sort_order: 'asc' } } } } },
      }),
      this.prisma.order.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.faceAnalysis.findUnique({ where: { user_id: userId } }),
      this.prisma.bodyAnalysis.findUnique({ where: { user_id: userId } }),
      this.findClosetItemsWithProducts(userId),
      this.prisma.searchHistory.findMany({
        where: {
          user_id: userId,
          searched_at: { gte: activitySince },
        },
        orderBy: { searched_at: 'desc' },
        take: 50,
      }),
      this.prisma.productView.findMany({
        where: {
          user_id: userId,
          viewed_at: { gte: activitySince },
        },
        include: { product: { include: { images: { orderBy: { sort_order: 'asc' } } } } },
        orderBy: { viewed_at: 'desc' },
        take: 40,
      }),
    ]);

    return {
      profile,
      fashionDna,
      wishlistItems,
      orders,
      faceAnalysis,
      bodyAnalysis,
      closetItems,
      searchHistory,
      productViews,
    };
  }

  findProductsByIds(ids) {
    if (!ids.length) {
      return Promise.resolve([]);
    }

    return this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: PRODUCT_INCLUDE,
    });
  }

  findCandidateProducts(excludeIds, limit) {
    return this.prisma.product.findMany({
      where: excludeIds.length ? { id: { notIn: excludeIds } } : undefined,
      include: PRODUCT_INCLUDE,
      take: Math.max(limit * 5, 50),
      orderBy: { created_at: 'desc' },
    });
  }
}
