import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

const ACTIVITY_LOOKBACK_DAYS = 90;

export @Injectable()
class FashionDnaActivityRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  activitySince() {
    const since = new Date();
    since.setDate(since.getDate() - ACTIVITY_LOOKBACK_DAYS);
    return since;
  }

  findOrders(userId) {
    return this.prisma.order.findMany({
      where: { user_id: userId },
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
}
