import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  HISTORY_CHANGE_SOURCES,
  resolveHistoryReason,
} from '../constants/fashion-dna-history.constants';
import { FashionDnaHistoryRepository } from '../repositories/fashion-dna-history.repository';

export @Injectable()
class FashionDnaHistoryService {
  constructor(@Inject(FashionDnaHistoryRepository) historyRepository) {
    this.historyRepository = historyRepository;
    this.logger = new Logger(FashionDnaHistoryService.name);
  }

  buildSnapshotRecord(fashionDna, changeSource) {
    return {
      user_id: fashionDna.user_id,
      fashion_dna_id: fashionDna.id,
      change_reason: resolveHistoryReason(changeSource),
      change_source: changeSource,
      style_type: fashionDna.style_type,
      color_affinity: fashionDna.color_affinity,
      budget_range: fashionDna.budget_range,
      brand_affinity: fashionDna.brand_affinity,
      fashion_confidence_score: fashionDna.fashion_confidence_score,
      face_traits: fashionDna.face_traits,
      body_traits: fashionDna.body_traits,
      preference_traits: fashionDna.preference_traits,
      activity_traits: fashionDna.activity_traits || {},
      dna_created_at: fashionDna.created_at,
      dna_updated_at: fashionDna.updated_at,
    };
  }

  async archiveBeforeChange(fashionDna, changeSource) {
    if (!fashionDna) {
      return null;
    }

    const record = await this.historyRepository.create(
      this.buildSnapshotRecord(fashionDna, changeSource),
    );

    this.logger.log(
      `Fashion DNA history archived | userId=${fashionDna.user_id} | reason=${record.change_reason} | historyId=${record.id}`,
    );

    return record;
  }

  async getHistory(userId, query = {}) {
    const records = await this.historyRepository.findByUserId(userId, query);

    return {
      items: records.map((record) => this.formatHistoryRecord(record)),
    };
  }

  formatHistoryRecord(record) {
    const preferenceTraits = record.preference_traits || {};
    const activityTraits = record.activity_traits || {};

    return {
      id: record.id,
      userId: record.user_id,
      fashionDnaId: record.fashion_dna_id,
      changeReason: record.change_reason,
      changeSource: record.change_source,
      styleType: record.style_type,
      fashionPersonality:
        preferenceTraits.fashion_personality
        || activityTraits.fashionPersonality
        || null,
      colorAffinity: record.color_affinity,
      topColors: activityTraits.topColors || [],
      colorAffinityScore: activityTraits.colorAffinityScore ?? 0,
      budgetRange: record.budget_range,
      brandAffinity: record.brand_affinity,
      fashionConfidenceScore: record.fashion_confidence_score,
      faceTraits: record.face_traits,
      bodyTraits: record.body_traits,
      preferenceTraits: record.preference_traits,
      activityTraits: record.activity_traits,
      dnaCreatedAt: record.dna_created_at,
      dnaUpdatedAt: record.dna_updated_at,
      archivedAt: record.archived_at,
    };
  }
}

export { HISTORY_CHANGE_SOURCES };
