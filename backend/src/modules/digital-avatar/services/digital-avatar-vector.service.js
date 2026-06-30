import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantService } from '../../../database/qdrant.service';
import { FashionDnaRepository } from '../../fashion-dna/repositories/fashion-dna.repository';
import {
  buildDeterministicDigitalAvatarVector,
  buildDigitalAvatarEmbeddingText,
  extractFashionDnaSummary,
} from '../utils/digital-avatar-embedding.util';
import { normalizeAvatarType } from '../utils/avatar-type.util';

export @Injectable()
class DigitalAvatarVectorService {
  constructor(
    @Inject(QdrantService) qdrantService,
    @Inject(ConfigService) configService,
    @Inject(FashionDnaRepository) fashionDnaRepository,
  ) {
    this.qdrantService = qdrantService;
    this.fashionDnaRepository = fashionDnaRepository;
    this.vectorSize = configService.get('digitalAvatar.vectorSize');
    this.logger = new Logger(DigitalAvatarVectorService.name);
  }

  resolveTraitsFromAvatarRecord(record) {
    const raw = record.raw_ai_response || {};
    const metadata = raw.metadata || raw;
    const faceAnalysis = metadata.faceAnalysis || {};
    const bodyAnalysis = metadata.bodyAnalysis || {};
    const hairAnalysis = metadata.hairAnalysis || {};

    return {
      avatarType:
        record.avatar_type
        || record.avatarType
        || metadata.avatarType
        || raw.avatarType
        || null,
      bodyType:
        bodyAnalysis.bodyType
        || metadata.bodyType
        || record.bodyType
        || null,
      faceShape:
        faceAnalysis.faceShape
        || metadata.faceShape
        || record.faceShape
        || null,
      skinTone:
        metadata.skinTone
        || faceAnalysis.skinTone
        || record.skinTone
        || null,
      hairStyle:
        hairAnalysis.hairStyle
        || metadata.hairStyle
        || record.hairStyle
        || null,
    };
  }

  buildPayload(userId, record, fashionDNA) {
    const traits = this.resolveTraitsFromAvatarRecord(record);

    return {
      userId,
      avatarType: normalizeAvatarType(traits.avatarType),
      bodyType: traits.bodyType,
      faceShape: traits.faceShape,
      skinTone: traits.skinTone,
      hairStyle: traits.hairStyle,
      fashionDNA,
      avatarVersion: record.version ?? null,
      avatarImagePath: record.avatar_image || record.avatarImagePath || null,
      updatedAt: new Date().toISOString(),
    };
  }

  resolveVector(record, fashionDNA) {
    const traits = this.resolveTraitsFromAvatarRecord(record);
    const text = buildDigitalAvatarEmbeddingText({
      ...traits,
      fashionDNA,
    });

    return buildDeterministicDigitalAvatarVector(text, this.vectorSize);
  }

  async syncUserVector(userId, record) {
    if (!userId || !record) {
      return null;
    }

    if (!this.qdrantService.isConfigured()) {
      this.logger.debug(
        `Qdrant not configured — skipping digital avatar vector sync for user ${userId}`,
      );
      return null;
    }

    const fashionDnaRecord = await this.fashionDnaRepository.findByUserId(userId);
    const fashionDNA = extractFashionDnaSummary(fashionDnaRecord);
    const vector = this.resolveVector(record, fashionDNA);
    const payload = this.buildPayload(userId, record, fashionDNA);

    await this.qdrantService.upsertDigitalAvatarVector(userId, vector, payload);

    this.logger.log(
      `Digital avatar vector synced | userId=${userId} | dimensions=${vector.length}`,
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

    return this.qdrantService.getDigitalAvatarVector(userId);
  }

  async searchSimilarUsers(userId, limit = 10) {
    if (!this.qdrantService.isConfigured()) {
      return [];
    }

    const vector = await this.getUserVector(userId);

    if (!vector?.length) {
      return [];
    }

    return this.qdrantService.searchDigitalAvatarSimilar(vector, limit, {
      excludeUserId: userId,
    });
  }
}
