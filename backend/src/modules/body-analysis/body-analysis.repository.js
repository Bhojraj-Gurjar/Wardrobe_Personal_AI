import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  mapAiResponseToPersistence,
  mapUpdateDtoToPersistence,
  mergeManualUpdateIntoRaw,
} from './utils/body-analysis.mapper';

export @Injectable()
class BodyAnalysisRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  findByUserId(userId) {
    return this.prisma.bodyAnalysis.findUnique({
      where: { user_id: userId },
    });
  }

  findUserBodyImageContext(userId) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        body_analysis: true,
      },
    });
  }

  updateProfileBodyImageRefs(userId, { body_image: bodyImage, preferences }) {
    return this.prisma.userProfile.update({
      where: { user_id: userId },
      data: {
        ...(bodyImage ? { body_image: bodyImage } : {}),
        ...(preferences ? { preferences } : {}),
      },
    });
  }

  /**
   * Persist AI analysis for a user.
   * Updates the existing row when present; otherwise creates exactly one row.
   * Enforced by unique user_id — never creates duplicates.
   * Always stores the full raw AI response payload.
   */
  saveAnalysisFromAi(userId, aiResponse, bodyImageUrl = null) {
    const data = mapAiResponseToPersistence(aiResponse);

    if (bodyImageUrl) {
      data.body_image_url = bodyImageUrl;
    }

    return this.prisma.bodyAnalysis.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        ...data,
      },
      update: data,
    });
  }

  saveBodyImagePath(userId, bodyImageUrl) {
    if (!bodyImageUrl) {
      return null;
    }

    return this.prisma.bodyAnalysis.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        body_image_url: bodyImageUrl,
      },
      update: {
        body_image_url: bodyImageUrl,
      },
    });
  }

  /**
   * Update manually overridden extracted traits.
   * Updates when a record exists; otherwise creates the user's first row.
   * Never creates duplicate rows (one record per user_id).
   */
  async saveOrUpdateExtractedTraits(userId, dto) {
    const extracted = mapUpdateDtoToPersistence(dto);

    if (!Object.keys(extracted).length) {
      return null;
    }

    const existing = await this.findByUserId(userId);
    const rawAiResponse = mergeManualUpdateIntoRaw(
      existing?.raw_ai_response,
      dto,
    );

    if (existing) {
      return this.prisma.bodyAnalysis.update({
        where: { user_id: userId },
        data: {
          ...extracted,
          raw_ai_response: rawAiResponse,
        },
      });
    }

    return this.prisma.bodyAnalysis.create({
      data: {
        user_id: userId,
        ...extracted,
        raw_ai_response: rawAiResponse,
      },
    });
  }
}
