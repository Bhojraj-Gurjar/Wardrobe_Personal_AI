import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantService } from '../../../database/qdrant.service';
import {
  buildBodyAnalysisEmbeddingText,
  buildDeterministicBodyAnalysisVector,
} from '../utils/body-analysis-embedding.util';

export @Injectable()
class BodyAnalysisVectorService {
  constructor(
    @Inject(QdrantService) qdrantService,
    @Inject(ConfigService) configService,
  ) {
    this.qdrantService = qdrantService;
    this.vectorSize = configService.get('bodyAnalysis.vectorSize');
    this.logger = new Logger(BodyAnalysisVectorService.name);
  }

  buildPayload(userId, record) {
    const raw = record.raw_ai_response || {};

    return {
      bodyType: record.bodyType ?? record.body_type ?? null,
      bodyShape: record.bodyShape ?? record.body_shape ?? null,
      measurements: record.measurements ?? raw.measurements ?? null,
      fitProfile: record.fitProfile ?? record.fit_profile ?? null,
      updatedAt: new Date().toISOString(),
    };
  }

  resolveVector(record) {
    if (Array.isArray(record.vector) && record.vector.length === this.vectorSize) {
      return record.vector;
    }

    const text = buildBodyAnalysisEmbeddingText(record);
    return buildDeterministicBodyAnalysisVector(text, this.vectorSize);
  }

  async syncUserVector(userId, record) {
    if (!userId || !record) {
      return null;
    }

    if (!this.qdrantService.isConfigured()) {
      this.logger.debug(
        `Qdrant not configured — skipping body analysis vector sync for user ${userId}`,
      );
      return null;
    }

    const vector = this.resolveVector(record);
    const payload = this.buildPayload(userId, record);

    await this.qdrantService.upsertBodyAnalysisVector(userId, vector, payload);

    this.logger.log(
      `Body analysis vector synced | userId=${userId} | dimensions=${vector.length}`,
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

    return this.qdrantService.getBodyAnalysisVector(userId);
  }

  async searchSimilarUsers(userId, limit = 10) {
    if (!this.qdrantService.isConfigured()) {
      return [];
    }

    const vector = await this.getUserVector(userId);

    if (!vector?.length) {
      return [];
    }

    return this.qdrantService.searchBodyAnalysisSimilar(vector, limit, {
      excludeUserId: userId,
    });
  }

  async searchSimilarByVector(vector, limit = 10, options = {}) {
    if (!this.qdrantService.isConfigured() || !vector?.length) {
      return [];
    }

    return this.qdrantService.searchBodyAnalysisSimilar(vector, limit, options);
  }
}
