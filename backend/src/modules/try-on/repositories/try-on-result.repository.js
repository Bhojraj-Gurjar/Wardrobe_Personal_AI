import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export @Injectable()
class TryOnResultRepository {
  constructor(@Inject(PrismaService) prisma) {
    this.prisma = prisma;
  }

  create(userId, data) {
    return this.prisma.tryOnResult.create({
      data: {
        user_id: userId,
        product_id: data.productId ?? null,
        body_image: data.bodyImage ?? null,
        garment_image: data.garmentImage ?? null,
        generated_image: data.generatedImage ?? null,
      },
      include: {
        product: {
          include: { images: { orderBy: { sort_order: 'asc' } } },
        },
      },
    });
  }

  findManyByUserId(userId, limit = 20) {
    return this.prisma.tryOnResult.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      include: {
        product: {
          include: { images: { orderBy: { sort_order: 'asc' } } },
        },
      },
    });
  }

  findById(userId, resultId) {
    return this.prisma.tryOnResult.findFirst({
      where: {
        id: resultId,
        user_id: userId,
      },
      include: {
        product: {
          include: { images: { orderBy: { sort_order: 'asc' } } },
        },
      },
    });
  }

  createSavedOutfit(userId, data) {
    return this.prisma.savedOutfit.create({
      data: {
        user_id: userId,
        ...data,
      },
    });
  }
}
