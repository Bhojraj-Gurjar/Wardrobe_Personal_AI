import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export @Injectable()
class UsersRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  findProfileByUserId(userId) {
    return this.prisma.userProfile.findUnique({
      where: { user_id: userId },
    });
  }

  updateProfileByUserId(userId, data) {
    return this.prisma.userProfile.update({
      where: { user_id: userId },
      data,
    });
  }
}
