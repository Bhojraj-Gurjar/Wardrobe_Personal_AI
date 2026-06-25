import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export @Injectable()
class VirtualTryOnRepository {
  constructor(@Inject(PrismaService) prisma) {
    this.prisma = prisma;
  }

  findSessionByUserId(userId) {
    return this.prisma.virtualTryOn.findUnique({ where: { user_id: userId } });
  }

  upsertSession(userId, data) {
    return this.prisma.virtualTryOn.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        ...data,
      },
      update: data,
    });
  }

  listSavedOutfits(userId) {
    return this.prisma.savedOutfit.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
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

  findSavedOutfit(userId, outfitId) {
    return this.prisma.savedOutfit.findFirst({
      where: {
        id: outfitId,
        user_id: userId,
      },
    });
  }

  deleteSavedOutfit(userId, outfitId) {
    return this.prisma.savedOutfit.deleteMany({
      where: {
        id: outfitId,
        user_id: userId,
      },
    });
  }

  updateProfileBodyImage(userId, bodyImagePath) {
    return this.prisma.virtualTryOn.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        body_image: bodyImagePath,
      },
      update: {
        body_image: bodyImagePath,
      },
    });
  }

  findUserContext(userId) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        body_analysis: true,
        fashion_dna: true,
        digital_avatars: {
          where: { is_active: true },
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });
  }

  createTryOnResult(userId, data) {
    return this.prisma.virtualTryOnResult.create({
      data: {
        user_id: userId,
        ...data,
      },
    });
  }

  listTryOnResults(userId, limit = 24) {
    return this.prisma.virtualTryOnResult.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });
  }

  findTryOnResult(userId, resultId) {
    return this.prisma.virtualTryOnResult.findFirst({
      where: {
        id: resultId,
        user_id: userId,
      },
    });
  }

  deleteTryOnResult(userId, resultId) {
    return this.prisma.virtualTryOnResult.deleteMany({
      where: {
        id: resultId,
        user_id: userId,
      },
    });
  }
}
