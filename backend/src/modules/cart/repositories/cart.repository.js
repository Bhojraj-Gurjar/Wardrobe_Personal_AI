import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

const PRODUCT_INCLUDE = {
  images: { orderBy: { sort_order: 'asc' } },
};

export @Injectable()
class CartRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  findByUserId(userId) {
    return this.prisma.cartItem.findMany({
      where: { user_id: userId },
      include: {
        product: {
          include: {
            ...PRODUCT_INCLUDE,
            variants: { select: { id: true, stock: true } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  findByUserAndProduct(userId, productId) {
    return this.prisma.cartItem.findFirst({
      where: { user_id: userId, product_id: productId },
      include: { product: { include: PRODUCT_INCLUDE } },
    });
  }

  findByIdAndUserId(id, userId) {
    return this.prisma.cartItem.findFirst({
      where: { id, user_id: userId },
      include: { product: { include: PRODUCT_INCLUDE } },
    });
  }

  productExists(productId) {
    return this.prisma.product.findFirst({
      where: { id: productId, is_active: true },
      select: {
        id: true,
        stock_quantity: true,
        visibility: true,
        variants: { select: { stock: true } },
      },
    });
  }

  create(userId, productId, quantity = 1) {
    return this.prisma.cartItem.create({
      data: {
        user_id: userId,
        product_id: productId,
        quantity,
      },
      include: { product: { include: PRODUCT_INCLUDE } },
    });
  }

  updateQuantity(id, quantity) {
    return this.prisma.cartItem.update({
      where: { id },
      data: { quantity },
      include: { product: { include: PRODUCT_INCLUDE } },
    });
  }

  delete(id) {
    return this.prisma.cartItem.delete({ where: { id } });
  }

  clearUserCart(userId) {
    return this.prisma.cartItem.deleteMany({ where: { user_id: userId } });
  }
}
