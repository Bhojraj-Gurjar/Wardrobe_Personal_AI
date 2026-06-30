import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export @Injectable()
class TryOnHistoryRepository {
  constructor(@Inject(PrismaService) prisma) {
    this.prisma = prisma;
  }

  create(userId, data) {
    return this.prisma.virtualTryOnResult.create({
      data: {
        user_id: userId,
        input_image: data.inputImage ?? null,
        transparent_image: data.transparentImage ?? null,
        generated_image: data.generatedImage ?? null,
        selected_products: data.selectedProducts ?? [],
      },
    });
  }

  findManyByUserId(userId, limit = 20) {
    return this.prisma.virtualTryOnResult.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }
}
