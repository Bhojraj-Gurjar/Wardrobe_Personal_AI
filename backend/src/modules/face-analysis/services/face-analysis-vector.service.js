import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantService } from '../../../database/qdrant.service';
import {
  buildDeterministicFaceAnalysisVector,
  buildFaceAnalysisEmbeddingText,
} from '../utils/face-analysis-embedding.util';

export @Injectable()
class FaceAnalysisVectorService {
  constructor(
    @Inject(QdrantService) qdrantService,
    @Inject(ConfigService) configService,
  ) {
    this.qdrantService = qdrantService;
    this.vectorSize = configService.get('faceAnalysis.vectorSize');
    this.logger = new Logger(FaceAnalysisVectorService.name);
  }

  buildPayload(userId, record) {
    return {
      faceShape: record.faceShape ?? record.face_shape ?? null,
      skinTone: record.skinTone ?? record.skin_tone ?? null,
      hairLength: record.hairLength ?? record.hair_length ?? null,
      hairColor: record.hairColor ?? record.hair_color ?? null,
      hairStyle: record.hairStyle ?? record.hair_style ?? null,
      beardType: record.beardType ?? record.beard_type ?? null,
      updatedAt: new Date().toISOString(),
    };
  }

  resolveVector(record) {
    if (Array.isArray(record.vector) && record.vector.length === this.vectorSize) {
      return record.vector;
    }

    const text = buildFaceAnalysisEmbeddingText(record);
    return buildDeterministicFaceAnalysisVector(text, this.vectorSize);
  }

  async syncUserVector(userId, record) {
    if (!userId || !record) {
      return null;
    }

    if (!this.qdrantService.isConfigured()) {
      this.logger.debug(
        `Qdrant not configured — skipping face analysis vector sync for user ${userId}`,
      );
      return null;
    }

    const vector = this.resolveVector(record);
    const payload = this.buildPayload(userId, record);

    await this.qdrantService.upsertFaceAnalysisVector(userId, vector, payload);

    this.logger.log(
      `Face analysis vector synced | userId=${userId} | dimensions=${vector.length}`,
    );

    return {
      userId,
      dimensions: vector.length,
      payload,
    };
  }

  async getUserVector(userId) {
    if (!this.qdrantService.isConfigured()) {
      return null;
    }

    return this.qdrantService.getFaceAnalysisVector(userId);
  }

  async searchSimilarUsers(userId, limit = 10) {
    if (!this.qdrantService.isConfigured()) {
      return [];
    }

    const vector = await this.getUserVector(userId);

    if (!vector?.length) {
      return [];
    }

    return this.qdrantService.searchFaceAnalysisSimilar(vector, limit, {
      excludeUserId: userId,
    });
  }

  async searchSimilarByVector(vector, limit = 10, options = {}) {
    if (!this.qdrantService.isConfigured() || !vector?.length) {
      return [];
    }

    return this.qdrantService.searchFaceAnalysisSimilar(vector, limit, options);
  }
}
