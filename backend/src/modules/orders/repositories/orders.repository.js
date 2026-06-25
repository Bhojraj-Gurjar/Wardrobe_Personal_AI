import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ORDER_STATUS } from '../validators/order.constants';
import {
  resolveAutoStatus,
  resolveStatusFilterValues,
  TERMINAL_ORDER_STATUSES,
} from '../utils/order-status.util';

const PRODUCT_INCLUDE = {
  images: { orderBy: { sort_order: 'asc' } },
};

const ORDER_INCLUDE = {
  product: { include: PRODUCT_INCLUDE },
  user: {
    include: {
      profile: true,
    },
  },
};

export @Injectable()
class OrdersRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  findManyByUserId(userId, query) {
    const where = { user_id: userId };
    const statusValues = resolveStatusFilterValues(query.status);

    if (statusValues) {
      where.status = { in: statusValues };
    }

    const skip = (query.page - 1) * query.limit;

    return this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { created_at: 'desc' },
        skip,
        take: query.limit,
      }),
      this.prisma.order.count({ where }),
    ]);
  }

  findByIdAndUserId(id, userId) {
    return this.prisma.order.findFirst({
      where: { id, user_id: userId },
      include: ORDER_INCLUDE,
    });
  }

  findById(id) {
    return this.prisma.order.findUnique({
      where: { id },
      include: ORDER_INCLUDE,
    });
  }

  findManyAdmin(query) {
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

    const skip = ((query.page || 1) - 1) * (query.limit || 50);

    return this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: ORDER_INCLUDE,
        orderBy: { created_at: 'desc' },
        skip,
        take: query.limit || 50,
      }),
      this.prisma.order.count({ where }),
    ]);
  }

  productExists(productId) {
    return this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
  }

  findProductsByIds(ids) {
    return this.prisma.product.findMany({
      where: { id: { in: ids } },
      include: PRODUCT_INCLUDE,
    });
  }

  create(userId, dto) {
    const data = {
      user_id: userId,
      total_amount: dto.total_amount,
      status: ORDER_STATUS.CREATED,
    };

    if (dto.product_id) {
      data.product_id = dto.product_id;
    }

    if (dto.order_number) {
      data.order_number = dto.order_number;
    }

    if (dto.subtotal !== undefined) {
      data.subtotal = dto.subtotal;
    }

    if (dto.shipping !== undefined) {
      data.shipping = dto.shipping;
    }

    if (dto.discount !== undefined) {
      data.discount = dto.discount;
    }

    if (dto.coupon_code) {
      data.coupon_code = dto.coupon_code;
    }

    if (dto.metadata) {
      data.metadata = dto.metadata;
    }

    return this.prisma.order.create({
      data,
      include: ORDER_INCLUDE,
    });
  }

  updateStatus(id, status) {
    return this.prisma.order.update({
      where: { id },
      data: { status },
      include: ORDER_INCLUDE,
    });
  }

  async syncAutoStatuses() {
    const orders = await this.prisma.order.findMany({
      where: {
        status: { notIn: TERMINAL_ORDER_STATUSES },
      },
      select: {
        id: true,
        status: true,
        created_at: true,
      },
    });

    const now = Date.now();
    const updates = [];

    for (const order of orders) {
      const nextStatus = resolveAutoStatus(order.created_at, order.status, now);

      if (nextStatus && nextStatus !== order.status) {
        updates.push(
          this.prisma.order.update({
            where: { id: order.id },
            data: { status: nextStatus },
          }),
        );
      }
    }

    if (!updates.length) {
      return 0;
    }

    await this.prisma.$transaction(updates);

    return updates.length;
  }

  countByStatus() {
    return this.prisma.order.groupBy({
      by: ['status'],
      _count: { status: true },
    });
  }

  aggregateRevenue() {
    return this.prisma.order.aggregate({
      _sum: { total_amount: true },
      _count: { id: true },
      where: {
        status: { not: ORDER_STATUS.CANCELLED },
      },
    });
  }
}
