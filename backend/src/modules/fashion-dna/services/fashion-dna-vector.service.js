import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantService } from '../../../database/qdrant.service';
import {
  buildDeterministicFashionDnaVector,
  buildFashionDnaEmbeddingText,
} from '../utils/fashion-dna-embedding.util';

export @Injectable()
class FashionDnaVectorService {
  constructor(
    @Inject(QdrantService) qdrantService,
    @Inject(ConfigService) configService,
  ) {
    this.qdrantService = qdrantService;
    this.vectorSize = configService.get('fashionDna.vectorSize');
    this.logger = new Logger(FashionDnaVectorService.name);
  }

  buildPayload(userId, record) {
    const colorAffinity = record.colorAffinity || record.color_affinity || {};
    const brandAffinity = record.brandAffinity || record.brand_affinity || {};
    const preferenceTraits = record.preferenceTraits || record.preference_traits || {};
    const activityTraits = record.activityTraits || record.activity_traits || {};
    const categoryAffinity =
      record.categoryAffinity || preferenceTraits.category_affinity || {};

    return {
      styleType: record.styleType || record.style_type || null,
      fashionPersonality:
        record.fashionPersonality
        || preferenceTraits.fashion_personality
        || activityTraits.fashionPersonality
        || null,
      colors: Object.keys(colorAffinity),
      topColors: activityTraits.topColors || [],
      colorAffinity,
      colorAffinityScore: activityTraits.colorAffinityScore ?? 0,
      brands: Object.keys(brandAffinity),
      brandAffinity,
      categories: Object.keys(categoryAffinity),
      categoryAffinity,
      budgetRange: record.budgetRange || record.budget_range || null,
      fashionConfidenceScore:
        record.fashionConfidenceScore ?? record.fashion_confidence_score ?? 0,
      updatedAt: new Date().toISOString(),
    };
  }

  resolveVector(record) {
    if (Array.isArray(record.vector) && record.vector.length === this.vectorSize) {
      return record.vector;
    }

    const text = buildFashionDnaEmbeddingText(record);
    return buildDeterministicFashionDnaVector(text, this.vectorSize);
  }

  async syncUserVector(userId, record) {
    if (!userId || !record) {
      return null;
    }

    if (!this.qdrantService.isConfigured()) {
      this.logger.debug(
        `Qdrant not configured — skipping Fashion DNA vector sync for user ${userId}`,
      );
      return null;
    }

    const vector = this.resolveVector(record);
    const payload = this.buildPayload(userId, record);

    await this.qdrantService.upsertFashionDnaVector(userId, vector, payload);

    this.logger.log(
      `Fashion DNA vector synced | userId=${userId} | dimensions=${vector.length}`,
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

    return this.qdrantService.getFashionDnaVector(userId);
  }

  async searchSimilarUsers(userId, limit = 10) {
    if (!this.qdrantService.isConfigured()) {
      return [];
    }

    const vector = await this.getUserVector(userId);

    if (!vector?.length) {
      return [];
    }

    return this.qdrantService.searchFashionDnaSimilar(vector, limit, {
      excludeUserId: userId,
    });
  }

  async searchSimilarByVector(vector, limit = 10, options = {}) {
    if (!this.qdrantService.isConfigured() || !vector?.length) {
      return [];
    }

    return this.qdrantService.searchFashionDnaSimilar(vector, limit, options);
  }
}
