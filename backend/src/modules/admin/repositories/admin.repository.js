import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { USER_ROLE } from '../../../common/constants/user-role';
import { ORDER_STATUS } from '../../orders/validators/order.constants';
import { resolveStatusFilterValues } from '../../orders/utils/order-status.util';

const PRODUCT_INCLUDE = {
  images: { orderBy: { sort_order: 'asc' } },
};

const ORDER_INCLUDE = {
  product: { include: PRODUCT_INCLUDE },
  user: { include: { profile: true } },
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

      const filtered = users.filter(
        (user) => (user.profile?.preferences?.plan || 'Free') === plan,
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
    return this.prisma.user.delete({ where: { id } });
  }

  findProducts({ search, page = 1, limit = 50 }) {
    const where = {};

    if (search) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { brand: { contains: term, mode: 'insensitive' } },
        { sku: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
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

  deleteProduct(id) {
    return this.prisma.product.delete({ where: { id } });
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
        { user: { email: { contains: term, mode: 'insensitive' } } },
        { user: { profile: { name: { contains: term, mode: 'insensitive' } } } },
      ];
    }

    const { skip, limit: take } = resolvePagination(query.page, query.limit);

    return this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { created_at: 'desc' },
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

  groupOrdersByStatus() {
    return this.prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
    });
  }

  groupOrdersByCategory() {
    return this.prisma.order.findMany({
      where: { status: { not: ORDER_STATUS.CANCELLED } },
      include: {
        product: { select: { category: true, price: true } },
      },
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
