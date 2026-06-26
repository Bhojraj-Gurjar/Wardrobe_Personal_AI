import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export @Injectable()
class ProductInteractionService {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  async recordInteraction(userId, productId, _type = 'view') {
    return this.prisma.productView.create({
      data: {
        user_id: userId,
        product_id: productId,
      },
    });
  }
}
