import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { USER_MEDIA_STATUS } from '../validators/user-media.constants';

export @Injectable()
class UserMediaRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  archiveActiveByModule(userId, module) {
    return this.prisma.userMedia.updateMany({
      where: {
        user_id: userId,
        module,
        status: USER_MEDIA_STATUS.ACTIVE,
      },
      data: {
        status: USER_MEDIA_STATUS.ARCHIVED,
        updated_at: new Date(),
      },
    });
  }

  create(data) {
    return this.prisma.userMedia.create({ data });
  }

  findLatestByModule(userId, module) {
    return this.prisma.userMedia.findFirst({
      where: {
        user_id: userId,
        module,
        status: USER_MEDIA_STATUS.ACTIVE,
        deleted_at: null,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  findActiveByUserId(userId) {
    return this.prisma.userMedia.findMany({
      where: {
        user_id: userId,
        status: USER_MEDIA_STATUS.ACTIVE,
        deleted_at: null,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  findHistoryByModule(userId, module, { limit = 20 } = {}) {
    return this.prisma.userMedia.findMany({
      where: {
        user_id: userId,
        module,
        deleted_at: null,
      },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  findByIdForUser(userId, id) {
    return this.prisma.userMedia.findFirst({
      where: {
        id,
        user_id: userId,
        deleted_at: null,
      },
    });
  }
}
