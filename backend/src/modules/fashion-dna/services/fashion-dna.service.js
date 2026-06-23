import {
  Inject,
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { FashionDnaRepository } from '../repositories/fashion-dna.repository';
import { AiService } from '../../ai/services/ai.service';
import { FashionDnaBehavioralService } from './fashion-dna-behavioral.service';

function resolveUserArtifacts(moduleRef) {
  const { UserArtifactsService } = require('../../user-artifacts/user-artifacts.service');
  return moduleRef.get(UserArtifactsService, { strict: false });
}
import {
  FashionDnaContextService,
  hasBehavioralActivity,
} from './fashion-dna-context.service';
import {
  extractOnboardingInputs,
  getMissingOnboardingFields,
  mapAiResponseToPayload,
} from './fashion-dna.generator';
import { FashionDnaCacheService } from './fashion-dna-cache.service';
import {
  FashionDnaHistoryService,
  HISTORY_CHANGE_SOURCES,
} from './fashion-dna-history.service';
import { FashionDnaVectorService } from './fashion-dna-vector.service';
import {
  deriveBudgetDisplay,
  deriveHistoryTimeline,
  derivePercentileLabel,
  derivePersonalityDescription,
  deriveStyleAttributes,
  deriveStyleRadar,
  deriveWeeklyGrowth,
  formatBrandAffinityList,
} from '../utils/fashion-dna-analytics.util';

export @Injectable()
class FashionDnaService {
  constructor(
    @Inject(FashionDnaRepository) fashionDnaRepository,
    @Inject(AiService) aiService,
    @Inject(FashionDnaContextService) contextService,
    @Inject(FashionDnaCacheService) cacheService,
    @Inject(FashionDnaHistoryService) historyService,
    @Inject(FashionDnaVectorService) vectorService,
    @Inject(ModuleRef) moduleRef,
  ) {
    this.fashionDnaRepository = fashionDnaRepository;
    this.aiService = aiService;
    this.contextService = contextService;
    this.cacheService = cacheService;
    this.historyService = historyService;
    this.vectorService = vectorService;
    this.moduleRef = moduleRef;
    this.logger = new Logger(FashionDnaService.name);
  }

  async getFashionDna(userId) {
    const cached = await this.cacheService.get(userId);

    if (cached) {
      return cached;
    }

    return resolveUserArtifacts(this.moduleRef).ensureFashionDna(userId);
  }

  async generateFashionDna(userId) {
    const context = await this.contextService.collectContext(userId);

    if (!context.profile) {
      throw new BadRequestException(
        'Complete your profile before generating Fashion DNA',
      );
    }

    this.ensureOnboardingComplete(context.profile);
    this.ensureBehavioralActivity(context.signals);

    return this.persistFashionDna(userId, context, HISTORY_CHANGE_SOURCES.GENERATE);
  }

  async generateFashionDnaIfReady(userId) {
    const context = await this.contextService.collectContext(userId);

    if (!context.profile) {
      return null;
    }

    const missingOnboarding = getMissingOnboardingFields(context.onboarding);

    if (missingOnboarding.length) {
      return null;
    }

    const hasFaceAnalysis = Boolean(
      context.faceTraits?.face_shape || context.faceTraits?.faceShape,
    );
    const hasBodyAnalysis = Boolean(
      context.bodyTraits?.body_type
      || context.bodyTraits?.bodyType
      || context.bodyTraits?.analysis_source === 'body_analysis_record',
    );

    if (!hasFaceAnalysis || !hasBodyAnalysis) {
      return null;
    }

    return this.persistFashionDna(
      userId,
      context,
      HISTORY_CHANGE_SOURCES.GENERATE,
      { skipBehavioralCheck: true },
    );
  }

  async persistFashionDna(userId, context, historySource, options = {}) {
    if (!options.skipBehavioralCheck) {
      this.ensureBehavioralActivity(context.signals);
    }

    const payload = await this.analyzeWithAi(userId, context);
    const existing = await this.fashionDnaRepository.findByUserId(userId);

    if (existing) {
      await this.historyService.archiveBeforeChange(existing, historySource);
    }

    const fashionDna = await this.fashionDnaRepository.upsert(userId, payload);
    const formatted = await this.formatFashionDna(fashionDna, userId);

    await this.cacheService.invalidate(userId);
    await this.cacheService.set(userId, formatted);

    return formatted;
  }

  ensureOnboardingComplete(profile) {
    const inputs = extractOnboardingInputs(profile);
    const missing = getMissingOnboardingFields(inputs);

    if (missing.length) {
      throw new BadRequestException(
        `Complete onboarding before generating Fashion DNA. Missing: ${missing.join(', ')}`,
      );
    }
  }

  ensureBehavioralActivity(signals) {
    if (!hasBehavioralActivity(signals)) {
      throw new BadRequestException(
        'Fashion DNA requires shopping activity. Add wishlist items, browse products, place an order, or search before generating.',
      );
    }
  }

  async updateFashionDna(userId, dto) {
    const existing = await this.fashionDnaRepository.findByUserId(userId);

    if (!existing) {
      throw new NotFoundException(
        'Fashion DNA not found. Generate it first using POST /fashion-dna/generate',
      );
    }

    const data = this.mapUpdateDtoToData(dto);

    if (!Object.keys(data).length) {
      throw new BadRequestException('Provide at least one field to update');
    }

    await this.historyService.archiveBeforeChange(
      existing,
      HISTORY_CHANGE_SOURCES.MANUAL_UPDATE,
    );

    const fashionDna = await this.fashionDnaRepository.updateByUserId(userId, data);
    const formatted = await this.formatFashionDna(fashionDna, userId);

    await this.vectorService.syncUserVector(userId, formatted);

    await this.cacheService.invalidate(userId);
    await this.cacheService.set(userId, formatted);

    return formatted;
  }

  async analyzeWithAi(userId, context) {
    if (!this.aiService.isConfigured()) {
      throw new ServiceUnavailableException(
        'Fashion DNA analysis unavailable — AI service is not configured',
      );
    }

    const analyzePayload = this.contextService.buildAnalyzePayload(context);

    try {
      const aiResponse = await this.aiService.analyzeFashionDna({
        ...analyzePayload,
        user_id: userId,
      });

      await this.vectorService.syncUserVector(userId, aiResponse);

      return mapAiResponseToPayload(aiResponse, context);
    } catch (error) {
      this.logger.error(
        `Fashion DNA AI analysis failed for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  mapUpdateDtoToData(dto) {
    const data = {};

    if (dto.style_type !== undefined) data.style_type = dto.style_type;
    if (dto.color_affinity !== undefined) data.color_affinity = dto.color_affinity;
    if (dto.budget_range !== undefined) data.budget_range = dto.budget_range;
    if (dto.brand_affinity !== undefined) data.brand_affinity = dto.brand_affinity;
    if (dto.fashion_confidence_score !== undefined) {
      data.fashion_confidence_score = dto.fashion_confidence_score;
    }
    if (dto.face_traits !== undefined) data.face_traits = dto.face_traits;
    if (dto.body_traits !== undefined) data.body_traits = dto.body_traits;
    if (dto.preference_traits !== undefined) {
      data.preference_traits = dto.preference_traits;
    }
    if (dto.activity_traits !== undefined) {
      data.activity_traits = dto.activity_traits;
    }

    return data;
  }

  async getFashionDnaHistory(userId, query = {}) {
    return this.historyService.getHistory(userId, query);
  }

  async formatFashionDna(fashionDna, userId = null) {
    const activityTraits = fashionDna.activity_traits || {};
    const preferenceTraits = fashionDna.preference_traits || {};
    const categoryAffinity = preferenceTraits.category_affinity || {};
    const fashionPersonality =
      preferenceTraits.fashion_personality
      || activityTraits.fashionPersonality
      || null;
    const confidenceScore = Math.round(
      Number(fashionDna.fashion_confidence_score) || 0,
    );
    const averageSpending = activityTraits.average_spending ?? null;
    const budgetDisplay = deriveBudgetDisplay(
      fashionDna.budget_range,
      averageSpending,
    );

    let historyItems = [];

    if (userId) {
      const history = await this.historyService.getHistory(userId, { limit: 50 });
      historyItems = history.items || [];
    }

    const styleAttributes = deriveStyleAttributes(
      categoryAffinity,
      fashionPersonality,
    );
    const styleRadar = deriveStyleRadar(categoryAffinity, fashionPersonality);
    const historyTimeline = deriveHistoryTimeline(
      historyItems,
      confidenceScore,
      fashionDna.updated_at,
    );
    const weeklyGrowth = deriveWeeklyGrowth(historyItems, confidenceScore);

    return {
      id: fashionDna.id,
      userId: fashionDna.user_id,
      styleType: fashionDna.style_type,
      fashionPersonality,
      personalityDescription: derivePersonalityDescription(fashionPersonality),
      percentileLabel: derivePercentileLabel(confidenceScore),
      colorAffinity: fashionDna.color_affinity,
      topColors: activityTraits.topColors || [],
      colorAffinityScore: activityTraits.colorAffinityScore ?? 0,
      budgetRange: fashionDna.budget_range,
      budgetRangeLabel: budgetDisplay.budgetRangeLabel,
      averageSpending: budgetDisplay.averageSpending,
      spendProgress: budgetDisplay.spendProgress,
      brandAffinity: fashionDna.brand_affinity,
      brandAffinityList: formatBrandAffinityList(fashionDna.brand_affinity),
      fashionConfidenceScore: confidenceScore,
      confidenceScore,
      styleAttributes,
      styleRadar,
      historyTimeline,
      weeklyGrowth,
      faceTraits: fashionDna.face_traits,
      bodyTraits: fashionDna.body_traits,
      preferenceTraits: fashionDna.preference_traits,
      activityTraits: fashionDna.activity_traits,
      createdAt: fashionDna.created_at,
      updatedAt: fashionDna.updated_at,
    };
  }
}
