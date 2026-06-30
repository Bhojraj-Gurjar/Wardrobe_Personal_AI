import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

const ACTIVITY_LOOKBACK_DAYS = 90;
const BASELINE_LOOKBACK_DAYS = 180;

export @Injectable()
class FashionDnaActivityRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  activitySince(days = ACTIVITY_LOOKBACK_DAYS) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    return since;
  }

  findOrders(userId) {
    return this.prisma.order.findMany({
      where: {
        user_id: userId,
        status: { not: 'CANCELLED' },
      },
      include: { product: true },
      orderBy: { created_at: 'desc' },
    });
  }

  findWishlistProducts(userId) {
    return this.prisma.wishlist.findMany({
      where: { user_id: userId },
      include: { product: true },
      orderBy: { created_at: 'desc' },
    });
  }

  findCartItems(userId) {
    return this.prisma.cartItem.findMany({
      where: { user_id: userId },
      include: { product: true },
      orderBy: { updated_at: 'desc' },
    });
  }

  findClosetItems(userId) {
    return this.prisma.personalClosetItem.findMany({
      where: {
        user_id: userId,
        is_removed: false,
      },
      orderBy: { purchased_at: 'desc' },
    });
  }

  findClosetProducts(userId) {
    return this.findClosetItems(userId).then(async (items) => {
      if (!items.length) {
        return [];
      }

      const productIds = [...new Set(items.map((item) => item.product_id))];
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
      });
      const productMap = new Map(products.map((product) => [product.id, product]));

      return items
        .map((item) => ({
          ...item,
          product: productMap.get(item.product_id) || null,
        }))
        .filter((item) => item.product);
    });
  }

  findRecentProductViews(userId) {
    return this.prisma.productView.findMany({
      where: {
        user_id: userId,
        viewed_at: { gte: this.activitySince() },
      },
      include: { product: true },
      orderBy: { viewed_at: 'desc' },
    });
  }

  findRecentSearchHistory(userId) {
    return this.prisma.searchHistory.findMany({
      where: {
        user_id: userId,
        searched_at: { gte: this.activitySince() },
      },
      orderBy: { searched_at: 'desc' },
      take: 100,
    });
  }

  findTryOnResults(userId) {
    return this.prisma.tryOnResult.findMany({
      where: {
        user_id: userId,
        created_at: { gte: this.activitySince() },
      },
      include: { product: true },
      orderBy: { created_at: 'desc' },
    });
  }

  findVirtualTryOnResults(userId) {
    return this.prisma.virtualTryOnResult.findMany({
      where: {
        user_id: userId,
        created_at: { gte: this.activitySince() },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  findSavedOutfits(userId) {
    return this.prisma.savedOutfit.findMany({
      where: {
        user_id: userId,
        created_at: { gte: this.activitySince() },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  countStylistSessions(userId) {
    return this.prisma.$queryRaw`
      SELECT COUNT(*)::int AS count
      FROM stylist_chat_sessions
      WHERE user_id = ${userId}
    `.then((rows) => Number(rows?.[0]?.count || 0)).catch(() => 0);
  }

  findFavoriteBrands(userId) {
    return this.prisma.favoriteBrand.findMany({
      where: {
        user_id: userId,
        is_removed: false,
      },
      orderBy: { interaction_count: 'desc' },
    });
  }

  findFavoriteColors(userId) {
    return this.prisma.favoriteColor.findMany({
      where: {
        user_id: userId,
        is_removed: false,
      },
      orderBy: { usage_percent: 'desc' },
    });
  }

  findBaselineProductViews(userId) {
    return this.prisma.productView.findMany({
      where: {
        user_id: userId,
        viewed_at: {
          gte: this.activitySince(BASELINE_LOOKBACK_DAYS),
          lt: this.activitySince(ACTIVITY_LOOKBACK_DAYS),
        },
      },
      include: { product: true },
      orderBy: { viewed_at: 'desc' },
    });
  }
}
