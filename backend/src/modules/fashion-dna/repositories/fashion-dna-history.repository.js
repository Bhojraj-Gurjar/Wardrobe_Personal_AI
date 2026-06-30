import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export @Injectable()
class FashionDnaHistoryRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  create(snapshot) {
    return this.prisma.fashionDnaHistory.create({
      data: snapshot,
    });
  }

  findByUserId(userId, query = {}) {
    const take = query.limit || 20;
    const skip = query.offset || 0;

    return this.prisma.fashionDnaHistory.findMany({
      where: { user_id: userId },
      orderBy: { archived_at: 'desc' },
      take,
      skip,
    });
  }
}
