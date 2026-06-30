import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export @Injectable()
class AvatarRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  findByUserId(userId) {
    return this.prisma.avatar.findUnique({
      where: { user_id: userId },
      include: {
        outfit: true,
        versions: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });
  }

  findById(avatarId) {
    return this.prisma.avatar.findUnique({
      where: { id: avatarId },
      include: { outfit: true },
    });
  }

  createAvatar(data) {
    return this.prisma.avatar.create({ data });
  }

  updateAvatar(userId, data) {
    return this.prisma.avatar.update({
      where: { user_id: userId },
      data,
    });
  }

  upsertAvatar(userId, data) {
    return this.prisma.avatar.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        ...data,
      },
      update: data,
    });
  }

  createVersion(data) {
    return this.prisma.avatarVersion.create({ data });
  }

  findOutfitByAvatarId(avatarId) {
    return this.prisma.avatarOutfit.findUnique({
      where: { avatar_id: avatarId },
    });
  }

  upsertOutfit(avatarId, data) {
    return this.prisma.avatarOutfit.upsert({
      where: { avatar_id: avatarId },
      create: {
        avatar_id: avatarId,
        ...data,
      },
      update: data,
    });
  }

  findProductsByIds(productIds = []) {
    const ids = [...new Set(productIds.filter(Boolean))];

    if (!ids.length) {
      return [];
    }

    return this.prisma.product.findMany({
      where: {
        id: { in: ids },
        is_active: true,
      },
      include: {
        images: {
          orderBy: { sort_order: 'asc' },
        },
      },
    });
  }
}
