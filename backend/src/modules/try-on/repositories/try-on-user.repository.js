import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export @Injectable()
class TryOnUserRepository {
  constructor(@Inject(PrismaService) prisma) {
    this.prisma = prisma;
  }

  findUserContext(userId) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        body_analysis: true,
      },
    });
  }
}
