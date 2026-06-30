import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  mapAiResponseToPersistence,
  mapUpdateDtoToPersistence,
  mergeManualUpdateIntoRaw,
} from './utils/face-analysis.mapper';

export @Injectable()
class FaceAnalysisRepository {
  constructor(@Inject(PrismaService) prismaService) {
    this.prisma = prismaService;
  }

  findByUserId(userId) {
    return this.prisma.faceAnalysis.findUnique({
      where: { user_id: userId },
    });
  }

  /**
   * Persist AI analysis for a user.
   * Updates the existing row when present; otherwise creates exactly one row.
   * Enforced by unique user_id — never creates duplicates.
   */
  saveAnalysisFromAi(userId, aiResponse) {
    const data = mapAiResponseToPersistence(aiResponse);

    return this.prisma.faceAnalysis.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        ...data,
      },
      update: data,
    });
  }

  /**
   * Update manually overridden extracted traits while keeping one record per user.
   */
  updateExtractedTraits(userId, dto, existingRecord) {
    const extracted = mapUpdateDtoToPersistence(dto);
    const rawAiResponse = mergeManualUpdateIntoRaw(
      existingRecord?.raw_ai_response,
      dto,
    );

    return this.prisma.faceAnalysis.update({
      where: { user_id: userId },
      data: {
        ...extracted,
        raw_ai_response: rawAiResponse,
      },
    });
  }
}
