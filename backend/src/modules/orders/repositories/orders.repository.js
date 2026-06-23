import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ORDER_STATUS } from '../validators/order.constants';

export @Injectable()
class OrdersRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  findManyByUserId(userId, query) {
    const where = { user_id: userId };

    if (query.status) {
      where.status = query.status;
    }

    const skip = (query.page - 1) * query.limit;

    return this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
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
      include: { product: true },
    });
  }

  productExists(productId) {
    return this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
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

    return this.prisma.order.create({
      data,
      include: { product: true },
    });
  }
}
