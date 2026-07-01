import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { USER_ROLE } from '../../../common/constants/user-role';
import { ORDER_STATUS } from '../../orders/validators/order.constants';
import { resolveStatusFilterValues } from '../../orders/utils/order-status.util';
import {
  buildCompletedRevenueWhereForRange,
  buildRefundRevenueWhereForRange,
  COMPLETED_REVENUE_STATUSES,
} from '../../orders/utils/order-revenue.util';
import { buildAdminProductListFilter } from '../../products/utils/catalog-visibility.util';

const PRODUCT_INCLUDE = {
  images: { orderBy: { sort_order: 'asc' } },
};

const ORDER_INCLUDE = {
  product: { include: PRODUCT_INCLUDE },
  user: { include: { profile: true } },
  documents: { orderBy: { created_at: 'desc' } },
  timeline: { orderBy: { created_at: 'asc' } },
};

function resolvePagination(page, limit, defaultLimit = 50) {
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
class AdminRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  findUserByEmail(email) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  }

  updateUserAdminAccess(userId, data) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  createAdminUser(data) {
    return this.prisma.user.create({ data });
  }

  createInvitedUser({ email, passwordHash, name, plan = 'Free' }) {
    return this.prisma.user.create({
      data: {
        email,
        password_hash: passwordHash,
        role: USER_ROLE.USER,
        status: 'ACTIVE',
        profile: {
          create: {
            name,
            preferences: { plan },
          },
        },
      },
      include: {
        profile: true,
        fashion_dna: true,
        orders: { select: { id: true, status: true } },
      },
    });
  }

  findUserById(id) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        fashion_dna: true,
        face_registration: true,
        orders: true,
      },
    });
  }

  findUsers({ search, status, plan, page = 1, limit = 50 }) {
    const where = {
      role: USER_ROLE.USER,
    };

    if (search) {
      const term = search.trim();
      where.OR = [
        { email: { contains: term, mode: 'insensitive' } },
        { profile: { name: { contains: term, mode: 'insensitive' } } },
      ];
    }

    if (status) {
      where.status = status.toUpperCase();
    }

    const { skip, limit: take } = resolvePagination(page, limit);

    return this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: {
          profile: true,
          fashion_dna: true,
          orders: { select: { id: true, status: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),
      this.prisma.user.count({ where }),
    ]).then(([users, total]) => {
      if (!plan) {
        return [users, total];
      }

      const filtered = (users ?? []).filter(
        (user) => (user?.profile?.preferences?.plan || 'Free') === plan,
      );

      return [filtered, filtered.length];
    });
  }

  updateUser(id, data) {
    const { name, plan, status, preferences, ...userData } = data;
    const profileData = {};

    if (name !== undefined) {
      profileData.name = name;
    }

    if (preferences !== undefined) {
      profileData.preferences = preferences;
    } else if (plan !== undefined) {
      profileData.preferences = { plan };
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...userData,
        ...(status ? { status: status.toUpperCase() } : {}),
        ...(Object.keys(profileData).length
          ? {
            profile: {
              upsert: {
                create: profileData,
                update: profileData,
              },
            },
          }
          : {}),
      },
      include: {
        profile: true,
        fashion_dna: true,
        orders: { select: { id: true, status: true } },
      },
    });
  }

  deactivateUser(id) {
    return this.prisma.user.update({
      where: { id },
      data: { status: 'INACTIVE' },
      include: { profile: true },
    });
  }

  deleteUser(id) {
    return this.prisma.$transaction((tx) => tx.user.delete({ where: { id } }));
  }

  findProducts({ search, page = 1, limit = 50 }) {
    const where = { ...buildAdminProductListFilter() };

    if (search) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { brand: { contains: term, mode: 'insensitive' } },
        { sku: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
        { product_type: { contains: term, mode: 'insensitive' } },
      ];
    }

    const { skip, limit: take } = resolvePagination(page, limit);

    return this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { sort_order: 'asc' } },
          orders: { select: { id: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),
      this.prisma.product.count({ where }),
    ]);
  }

  createProduct(data) {
    return this.prisma.product.create({
      data,
      include: PRODUCT_INCLUDE,
    });
  }

  updateProduct(id, data) {
    return this.prisma.product.update({
      where: { id },
      data,
      include: PRODUCT_INCLUDE,
    });
  }

  toggleProductStatus(id) {
    return this.prisma.product.findUnique({ where: { id } }).then((product) => {
      if (!product) {
        return null;
      }

      return this.prisma.product.update({
        where: { id },
        data: { is_active: !product.is_active },
        include: PRODUCT_INCLUDE,
      });
    });
  }

  findOrders(query) {
    const where = {};
    const statusValues = resolveStatusFilterValues(query.status);

    if (statusValues) {
      where.status = { in: statusValues };
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { order_number: { contains: term, mode: 'insensitive' } },
        { invoice_number: { contains: term, mode: 'insensitive' } },
        { tracking_number: { contains: term, mode: 'insensitive' } },
        { user: { email: { contains: term, mode: 'insensitive' } } },
        { user: { mobile: { contains: term, mode: 'insensitive' } } },
        { user: { profile: { name: { contains: term, mode: 'insensitive' } } } },
        { items: { some: { product: { sku: { contains: term, mode: 'insensitive' } } } } },
      ];
    }

    if (query.dateFrom || query.dateTo) {
      where.created_at = {};
      if (query.dateFrom) {
        where.created_at.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        const end = new Date(query.dateTo);
        end.setHours(23, 59, 59, 999);
        where.created_at.lte = end;
      }
    }

    if (query.payment_method) {
      where.payment_method = query.payment_method;
    }

    if (query.priority) {
      where.priority = query.priority;
    }

    const orderBy = (() => {
      switch (query.sort) {
        case 'oldest':
          return { created_at: 'asc' };
        case 'highest_value':
          return { total_amount: 'desc' };
        case 'lowest_value':
          return { total_amount: 'asc' };
        case 'priority':
          return { priority: 'desc' };
        default:
          return { created_at: 'desc' };
      }
    })();

    const { skip, limit: take } = resolvePagination(query.page, query.limit);

    return this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy,
        skip,
        take,
      }),
      this.prisma.order.count({ where }),
    ]);
  }

  findOrderById(id) {
    return this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
  }

  updateOrderStatus(id, status) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: ORDER_INCLUDE,
    });
  }

  countUsers() {
    return this.prisma.user.count({ where: { role: USER_ROLE.USER } });
  }

  countActiveUsers() {
    return this.prisma.user.count({
      where: { role: USER_ROLE.USER, status: 'ACTIVE' },
    });
  }

  countOrders(where = {}) {
    return this.prisma.order.count({ where });
  }

  aggregateOrderRevenue(where = {}) {
    return this.prisma.order.aggregate({
      where: {
        status: { not: ORDER_STATUS.CANCELLED },
        ...where,
      },
      _sum: { total_amount: true },
    });
  }

  async aggregateNetRecognizedRevenue(start, end) {
    const [recognized, refunds] = await Promise.all([
      this.prisma.order.aggregate({
        where: buildCompletedRevenueWhereForRange(start, end),
        _sum: { total_amount: true },
      }),
      this.prisma.order.aggregate({
        where: buildRefundRevenueWhereForRange(start, end),
        _sum: { total_amount: true },
      }),
    ]);

    const gross = recognized._sum.total_amount || 0;
    const refundTotal = refunds._sum.total_amount || 0;

    return {
      gross: Math.round(gross),
      refunds: Math.round(refundTotal),
      net: Math.round(gross - refundTotal),
    };
  }

  countRecognizedOrdersInRange(start, end) {
    return this.prisma.order.count({
      where: buildCompletedRevenueWhereForRange(start, end),
    });
  }

  countOrdersCreatedInRange(start, end) {
    return this.prisma.order.count({
      where: {
        created_at: { gte: start, lte: end },
        status: { not: ORDER_STATUS.CANCELLED },
      },
    });
  }

  countProductViewsInRange(start, end) {
    return this.prisma.productView.count({
      where: {
        viewed_at: { gte: start, lte: end },
      },
    });
  }

  async countEngagedUsersInRange(start, end) {
    const [orderUsers, viewUsers] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          created_at: { gte: start, lte: end },
          user_id: { not: null },
        },
        select: { user_id: true },
        distinct: ['user_id'],
      }),
      this.prisma.productView.findMany({
        where: {
          viewed_at: { gte: start, lte: end },
          user_id: { not: null },
        },
        select: { user_id: true },
        distinct: ['user_id'],
      }),
    ]);

    return new Set([
      ...orderUsers.map((row) => row.user_id),
      ...viewUsers.map((row) => row.user_id),
    ]).size;
  }

  getRevenueOrdersSince(start) {
    return this.prisma.order.findMany({
      where: {
        OR: [
          {
            status: { in: COMPLETED_REVENUE_STATUSES },
            OR: [
              { completed_at: { gte: start } },
              { delivered_at: { gte: start } },
            ],
          },
          {
            status: { in: [ORDER_STATUS.REFUNDED, ORDER_STATUS.RETURNED] },
            updated_at: { gte: start },
          },
          {
            created_at: { gte: start },
            status: { not: ORDER_STATUS.CANCELLED },
          },
        ],
      },
      select: {
        total_amount: true,
        status: true,
        created_at: true,
        completed_at: true,
        delivered_at: true,
        updated_at: true,
        user_id: true,
      },
    });
  }

  groupOrdersByCategory({ since = null } = {}) {
    const and = [{ status: { in: COMPLETED_REVENUE_STATUSES } }];

    if (since) {
      and.push({
        OR: [
          { completed_at: { gte: since } },
          { delivered_at: { gte: since } },
        ],
      });
    }

    return this.prisma.order.findMany({
      where: { AND: and },
      include: {
        product: { select: { category: true, product_type: true, price: true } },
      },
    });
  }

  groupOrdersByStatus() {
    return this.prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
    });
  }

  findOrdersWithUsers() {
    return this.prisma.order.findMany({
      include: ORDER_INCLUDE,
      orderBy: { created_at: 'desc' },
    });
  }

  countUsersWithFaceAnalysis() {
    return this.prisma.faceAnalysis.count();
  }

  countUsersWithBodyAnalysis() {
    return this.prisma.bodyAnalysis.count();
  }

  countUsersWithFashionDna() {
    return this.prisma.fashionDna.count();
  }

  getMonthlyStats(months = 6) {
    const start = new Date();
    start.setMonth(start.getMonth() - (months - 1));
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    return this.prisma.$transaction([
      this.prisma.order.findMany({
        where: {
          created_at: { gte: start },
          status: { not: ORDER_STATUS.CANCELLED },
        },
        select: {
          total_amount: true,
          created_at: true,
          user_id: true,
        },
      }),
      this.prisma.user.findMany({
        where: { created_at: { gte: start }, role: USER_ROLE.USER },
        select: { created_at: true },
      }),
    ]);
  }

  updateAdminProfile(userId, data) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          upsert: {
            create: { name: data.name },
            update: { name: data.name },
          },
        },
      },
      include: { profile: true, face_registration: true },
    });
  }

  updateAdminPassword(userId, passwordHash) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password_hash: passwordHash },
    });
  }
}
