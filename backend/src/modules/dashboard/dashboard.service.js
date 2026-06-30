import { Inject, Injectable, Logger } from '@nestjs/common';
import { FashionDnaService } from '../fashion-dna/services/fashion-dna.service';
import { PersonalClosetService } from '../personal-closet/personal-closet.service';
import { RecommendationsService } from '../recommendations/services/recommendations.service';
import { DashboardRepository } from './dashboard.repository';

const EMPTY_TODAYS_PICKS = {
  items: [],
  meta: { total: 0 },
};

export @Injectable()
class DashboardService {
  constructor(
    @Inject(DashboardRepository) dashboardRepository,
    @Inject(PersonalClosetService) personalClosetService,
    @Inject(FashionDnaService) fashionDnaService,
    @Inject(RecommendationsService) recommendationsService,
  ) {
    this.dashboardRepository = dashboardRepository;
    this.personalClosetService = personalClosetService;
    this.fashionDnaService = fashionDnaService;
    this.recommendationsService = recommendationsService;
    this.logger = new Logger(DashboardService.name);
  }

  async getSummary(userId) {
    const [
      closetOverview,
      savedLooksCount,
      fashionDnaRecord,
    ] = await Promise.all([
      this.personalClosetService.getOverview(userId),
      this.dashboardRepository.countSavedOutfits(userId),
      this.dashboardRepository.findLatestFashionDna(userId),
    ]);

    let todaysPicks = EMPTY_TODAYS_PICKS;

    try {
      todaysPicks = await this.recommendationsService.getRecommendations(
        userId,
        { limit: 4, type: 'daily' },
      );
    } catch (error) {
      this.logger.warn(
        `Daily recommendations unavailable for user ${userId}: ${error?.message || error}`,
      );
    }

    const styleScore = this.resolveStyleScore(fashionDnaRecord);
    const aiMatchesCount = Number(
      todaysPicks?.meta?.total ?? todaysPicks?.items?.length ?? 0,
    );

    return {
      stats: {
        wardrobeItemsCount: closetOverview?.purchasedItems ?? 0,
        styleScore,
        aiMatchesCount: Number.isFinite(aiMatchesCount) ? aiMatchesCount : 0,
        savedLooksCount: savedLooksCount ?? 0,
      },
      fashionDna: await this.buildFashionDnaSummary(userId, fashionDnaRecord),
      todaysPicks: Array.isArray(todaysPicks?.items) ? todaysPicks.items : [],
    };
  }

  resolveStyleScore(fashionDnaRecord) {
    if (!fashionDnaRecord?.fashion_confidence_score) {
      return null;
    }

    const score = Math.round(Number(fashionDnaRecord.fashion_confidence_score));

    if (!Number.isFinite(score) || score <= 0) {
      return null;
    }

    return score;
  }

  async buildFashionDnaSummary(userId, fashionDnaRecord) {
    if (!fashionDnaRecord) {
      return {
        score: null,
        confidenceLabel: 'Not generated',
        rankLabel: 'Complete onboarding to unlock',
        styleType: null,
        fashionConfidenceScore: null,
        isDefault: true,
        isEmpty: true,
      };
    }

    try {
      const fashionDna = await this.fashionDnaService.getFashionDna(userId);
      const score = Math.round(
        Number(fashionDna?.fashionConfidenceScore ?? fashionDna?.confidenceScore) || 0,
      );
      const isDefault = Boolean(
        fashionDna?.isDefault || fashionDna?.preferenceTraits?.isDefault,
      );
      const hasScore = score > 0 && !isDefault;

      return {
        score: hasScore ? score : null,
        confidenceLabel: hasScore ? `${score}/100` : 'Not generated',
        rankLabel: fashionDna?.styleType
          ? String(fashionDna.styleType).replace(/_/g, ' ')
          : 'Your style profile',
        styleType: fashionDna?.styleType ?? fashionDnaRecord.style_type ?? null,
        fashionConfidenceScore: hasScore ? score : null,
        isDefault,
        isEmpty: !hasScore,
      };
    } catch {
      const score = this.resolveStyleScore(fashionDnaRecord);

      return {
        score,
        confidenceLabel: score !== null ? `${score}/100` : 'Not generated',
        rankLabel: fashionDnaRecord.style_type
          ? String(fashionDnaRecord.style_type).replace(/_/g, ' ')
          : 'Complete onboarding to unlock',
        styleType: fashionDnaRecord.style_type ?? null,
        fashionConfidenceScore: score,
        isDefault: score === null,
        isEmpty: score === null,
      };
    }
  }
}
