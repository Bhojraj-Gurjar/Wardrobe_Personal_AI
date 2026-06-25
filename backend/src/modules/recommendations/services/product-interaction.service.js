import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

const TRENDING_WEIGHTS = {
  view: { views: 1 },
  wishlist: { wishlist_count: 1 },
  like: { wishlist_count: 0.5 },
  purchase: { views: 2, wishlist_count: 1 },
  avatar_try_on: { try_on_count: 1, views: 0.5 },
};

export @Injectable()
class ProductInteractionService {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  async recordInteraction(userId, productId, type) {
    const interaction = await this.prisma.userProductInteraction.create({
      data: {
        user_id: userId,
        product_id: productId,
        type,
      },
    });

    await this.incrementTrendingStat(productId, type);

    return interaction;
  }

  async incrementTrendingStat(productId, type) {
    const weights = TRENDING_WEIGHTS[type] || { views: 1 };
    const existing = await this.prisma.productTrendingStat.findUnique({
      where: { product_id: productId },
    });

    const views = (existing?.views || 0) + (weights.views || 0);
    const wishlistCount = (existing?.wishlist_count || 0) + (weights.wishlist_count || 0);
    const tryOnCount = (existing?.try_on_count || 0) + (weights.try_on_count || 0);
    const score = views * 0.4 + wishlistCount * 1.5 + tryOnCount * 2;

    return this.prisma.productTrendingStat.upsert({
      where: { product_id: productId },
      create: {
        product_id: productId,
        views,
        wishlist_count: wishlistCount,
        try_on_count: tryOnCount,
        score,
      },
      update: {
        views,
        wishlist_count: wishlistCount,
        try_on_count: tryOnCount,
        score,
      },
    });
  }
}
