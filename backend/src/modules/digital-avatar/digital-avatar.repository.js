import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export @Injectable()
class DigitalAvatarRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  findActiveByUserId(userId) {
    return this.prisma.digitalAvatar.findFirst({
      where: { user_id: userId, is_active: true },
      orderBy: { version: 'desc' },
    });
  }

  findHistoryByUserId(userId) {
    return this.prisma.digitalAvatar.findMany({
      where: { user_id: userId },
      orderBy: { version: 'asc' },
    });
  }

  findByIdAndUserId(userId, avatarId) {
    return this.prisma.digitalAvatar.findFirst({
      where: { id: avatarId, user_id: userId },
    });
  }

  findById(avatarId) {
    return this.prisma.digitalAvatar.findUnique({
      where: { id: avatarId },
    });
  }

  getLatestVersion(userId) {
    return this.prisma.digitalAvatar.findFirst({
      where: { user_id: userId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
  }

  findByUserIdAndVersion(userId, version) {
    return this.prisma.digitalAvatar.findFirst({
      where: { user_id: userId, version },
    });
  }

  deactivateAllForUser(userId, tx = this.prisma) {
    return tx.digitalAvatar.updateMany({
      where: { user_id: userId, is_active: true },
      data: { is_active: false },
    });
  }

  createAvatar(data, tx = this.prisma) {
    return tx.digitalAvatar.create({ data });
  }

  updateAvatar(id, data, tx = this.prisma) {
    return tx.digitalAvatar.update({
      where: { id },
      data,
    });
  }

  activateAvatar(userId, avatarId) {
    return this.prisma.$transaction(async (tx) => {
      const avatar = await tx.digitalAvatar.findFirst({
        where: { id: avatarId, user_id: userId },
      });

      if (!avatar) {
        return null;
      }

      await this.deactivateAllForUser(userId, tx);

      return tx.digitalAvatar.update({
        where: { id: avatarId },
        data: { is_active: true },
      });
    });
  }

  createAndActivateAvatar(userId, data) {
    return this.prisma.$transaction(async (tx) => {
      await this.deactivateAllForUser(userId, tx);
      return tx.digitalAvatar.create({
        data: {
          ...data,
          is_active: true,
        },
      });
    });
  }
}
