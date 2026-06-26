import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

const PRODUCT_INCLUDE = {
  images: { orderBy: { sort_order: 'asc' } },
};

export @Injectable()
class RecommendationsRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  async getUserSignals(userId) {
    const [
      profile,
      fashionDna,
      wishlistItems,
      orders,
      faceAnalysis,
      bodyAnalysis,
      closetItems,
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
      this.prisma.personalClosetItem.findMany({
        where: { user_id: userId, is_removed: false },
        include: { product: { include: { images: { orderBy: { sort_order: 'asc' } } } } },
        take: 20,
        orderBy: { created_at: 'desc' },
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
