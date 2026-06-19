import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export @Injectable()
class FashionDnaRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  findByUserId(userId) {
    return this.prisma.fashionDna.findUnique({
      where: { user_id: userId },
    });
  }

  findUserProfile(userId) {
    return this.prisma.userProfile.findUnique({
      where: { user_id: userId },
    });
  }

  findWishlistProducts(userId) {
    return this.prisma.wishlist.findMany({
      where: { user_id: userId },
      include: { product: true },
    });
  }

  upsert(userId, data) {
    return this.prisma.fashionDna.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        ...data,
      },
      update: data,
    });
  }
}
