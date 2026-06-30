import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export @Injectable()
class DashboardRepository {
  constructor(@Inject(PrismaService) prisma) {
    this.prisma = prisma;
  }

  countSavedOutfits(userId) {
    return this.prisma.savedOutfit.count({
      where: { user_id: userId },
    });
  }

  findLatestFashionDna(userId) {
    return this.prisma.fashionDna.findUnique({
      where: { user_id: userId },
    });
  }
}
