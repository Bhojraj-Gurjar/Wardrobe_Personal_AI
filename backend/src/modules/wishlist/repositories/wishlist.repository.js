import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

const PRODUCT_INCLUDE = {
  images: { orderBy: { sort_order: 'asc' } },
};

export @Injectable()
class WishlistRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  findByUserId(userId) {
    return this.prisma.wishlist.findMany({
      where: { user_id: userId },
      include: { product: { include: PRODUCT_INCLUDE } },
      orderBy: { created_at: 'desc' },
    });
  }

  findByIdAndUserId(id, userId) {
    return this.prisma.wishlist.findFirst({
      where: { id, user_id: userId },
      include: { product: { include: PRODUCT_INCLUDE } },
    });
  }

  findByUserAndProduct(userId, productId) {
    return this.prisma.wishlist.findUnique({
      where: {
        user_id_product_id: {
          user_id: userId,
          product_id: productId,
        },
      },
    });
  }

  async productExists(productId) {
    const count = await this.prisma.product.count({
      where: { id: productId },
    });
    return count > 0;
  }

  create(userId, productId) {
    return this.prisma.wishlist.create({
      data: {
        user_id: userId,
        product_id: productId,
      },
      include: { product: { include: PRODUCT_INCLUDE } },
    });
  }

  delete(id) {
    return this.prisma.wishlist.delete({
      where: { id },
    });
  }
}
