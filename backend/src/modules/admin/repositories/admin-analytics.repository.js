import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { USER_ROLE } from '../../../common/constants/user-role';
import { ORDER_STATUS } from '../../orders/validators/order.constants';
import { buildAdminProductListFilter } from '../../products/utils/catalog-visibility.util';

const RETURN_STATUSES = [ORDER_STATUS.RETURNED, ORDER_STATUS.REFUNDED];

function resolvePagination(page, limit, defaultLimit = 20) {
  const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
  const limitNum = Math.min(
    100,
    Math.max(1, Number.parseInt(limit, 10) || defaultLimit),
  );

  return {
    page: pageNum,
    limit: limitNum,
    skip: (pageNum - 1) * limitNum,
  };
}

export @Injectable()
class AdminAnalyticsRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  getCustomerOrderAggregates() {
    return this.prisma.order.groupBy({
      by: ['user_id'],
      where: {
        user_id: { not: null },
        status: { not: ORDER_STATUS.CANCELLED },
      },
      _count: { _all: true },
      _sum: { total_amount: true },
      _max: { created_at: true },
    });
  }

  countCustomers(where = {}) {
    return this.prisma.user.count({
      where: {
        role: USER_ROLE.USER,
        ...where,
      },
    });
  }

  findCustomersForAnalytics({ search, status } = {}) {
    const where = { role: USER_ROLE.USER };

    if (search) {
      const term = search.trim();
      where.OR = [
        { email: { contains: term, mode: 'insensitive' } },
        { mobile: { contains: term, mode: 'insensitive' } },
        { profile: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    if (status === 'active') {
      where.status = 'ACTIVE';
    } else if (status === 'blocked') {
      where.status = { in: ['INACTIVE', 'SUSPENDED'] };
    }

    return this.prisma.user.findMany({
      where,
      include: {
        profile: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  getProductEngagementAggregates() {
    return this.prisma.$transaction([
      this.prisma.order.groupBy({
        by: ['product_id'],
        where: {
          product_id: { not: null },
          status: { not: ORDER_STATUS.CANCELLED },
        },
        _count: { _all: true },
        _sum: { total_amount: true },
      }),
      this.prisma.order.groupBy({
        by: ['product_id'],
        where: {
          product_id: { not: null },
          status: { in: RETURN_STATUSES },
        },
        _count: { _all: true },
      }),
      this.prisma.wishlist.groupBy({
        by: ['product_id'],
        _count: { _all: true },
      }),
      this.prisma.cartItem.groupBy({
        by: ['product_id'],
        _count: { _all: true },
      }),
    ]);
  }

  findProductsForAnalytics({ search, category, stock } = {}) {
    const where = { ...buildAdminProductListFilter() };

    if (search) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { sku: { contains: term, mode: 'insensitive' } },
        { brand: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (stock === 'low') {
      where.stock_quantity = { lte: 10, gt: 0 };
    } else if (stock === 'out') {
      where.stock_quantity = { lte: 0 };
    }

    return this.prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { sort_order: 'asc' }, take: 1 },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  paginateItems(items, page, limit) {
    const { skip, limit: take, page: pageNum } = resolvePagination(page, limit);
    const total = items.length;

    return {
      items: items.slice(skip, skip + take),
      meta: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take) || 1,
      },
    };
  }

  getUsersForGrowthAnalytics() {
    return this.prisma.user.findMany({
      where: { role: USER_ROLE.USER },
      select: {
        id: true,
        status: true,
        created_at: true,
        profile: { select: { preferences: true } },
        face_registration: { select: { id: true } },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  getOrdersForGrowthAnalytics() {
    return this.prisma.order.findMany({
      select: {
        id: true,
        user_id: true,
        status: true,
        total_amount: true,
        created_at: true,
        payment_method: true,
        product: { select: { category: true } },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  getSupportDeviceSignals() {
    return this.prisma.supportTicket.findMany({
      where: { deleted_at: null },
      select: {
        user_id: true,
        device_info: true,
        browser_info: true,
        os_info: true,
        created_at: true,
      },
    });
  }

  getProductViewSignals() {
    return this.prisma.productView.findMany({
      select: {
        user_id: true,
        viewed_at: true,
      },
    });
  }

  getSearchSignals() {
    return this.prisma.searchHistory.findMany({
      select: {
        user_id: true,
        searched_at: true,
      },
    });
  }

  getProductCategoryCounts() {
    return this.prisma.product.groupBy({
      by: ['category'],
      where: buildAdminProductListFilter(),
      _count: { _all: true },
    });
  }

  getWishlistCategoryCounts() {
    return this.prisma.wishlist.findMany({
      select: {
        product: { select: { category: true } },
      },
    });
  }

  getCartCategoryCounts() {
    return this.prisma.cartItem.findMany({
      select: {
        product: { select: { category: true } },
      },
    });
  }

  getOrdersWithCategory() {
    return this.prisma.order.findMany({
      select: {
        id: true,
        user_id: true,
        status: true,
        total_amount: true,
        created_at: true,
        payment_method: true,
        product: { select: { category: true } },
      },
    });
  }

  getCategoryReturnCounts() {
    return this.prisma.order.groupBy({
      by: ['product_id'],
      where: {
        product_id: { not: null },
        status: { in: RETURN_STATUSES },
      },
      _count: { _all: true },
    });
  }
}
