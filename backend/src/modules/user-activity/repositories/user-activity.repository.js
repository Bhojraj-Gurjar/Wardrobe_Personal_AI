import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export @Injectable()
class UserActivityRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  productExists(productId) {
    return this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
  }

  createProductView(userId, productId) {
    return this.prisma.productView.create({
      data: {
        user_id: userId,
        product_id: productId,
      },
    });
  }

  createSearchHistory(userId, query) {
    return this.prisma.searchHistory.create({
      data: {
        user_id: userId,
        query: query.trim(),
      },
    });
  }
}
