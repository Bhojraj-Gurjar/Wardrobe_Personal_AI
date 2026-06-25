import { Inject, Injectable, Logger } from '@nestjs/common';
import { QdrantService } from '../../../database/qdrant.service';
import { AiService } from '../../ai/services/ai.service';
import { RecommendationsRepository } from '../repositories/recommendations.repository';
import { EmbeddingProviderFactory } from '../providers/embedding.provider';
import { RecommendationStrategyRegistry } from './strategies/recommendation-strategy.registry';
import { RecommendationEngineRegistry } from './engines/recommendation-engine.registry';
import {
  buildBehaviorProfile,
  buildBudgetProfile,
  buildFactorsSummary,
  buildSimilarUserProfile,
  buildTrendingProfile,
  buildUserSignals,
} from './recommendation-context.builder';
import {
  RECOMMENDATION_SOURCES,
  RECOMMENDATION_TYPES,
  DEFAULT_LIMIT,
} from '../types';
import {
  blendCandidatePools,
  buildRecommendationRecords,
  buildSeasonalContext,
  dedupeProductsById,
  rankScoredProducts,
} from '../utils';
import { blendDailyRecommendations } from '../utils/daily-blend.util';
import { isProductInBudget } from '../utils/budget-score.util';
import { filterRecommendableProducts, isRecommendableProduct } from '../utils/product-eligibility.util';
import { canPersonalizeRecommendations } from '../utils/personalization-gate.util';
import {
  buildCombinedReason,
  deriveRecommendationBadges,
} from '../utils/recommendation-reason-combiner.util';
import { formatCatalogProduct } from '../../products/utils/product-catalog.mapper';

const EMPTY_STATE_MESSAGE = 'Complete your profile to receive personalized recommendations.';

export @Injectable()
class SmartRecommendationService {
  constructor(
    @Inject(RecommendationsRepository) recommendationsRepository,
    @Inject(QdrantService) qdrantService,
    @Inject(EmbeddingProviderFactory) embeddingProviderFactory,
    @Inject(AiService) aiService,
    @Inject(RecommendationStrategyRegistry) strategyRegistry,
    @Inject(RecommendationEngineRegistry) engineRegistry,
  ) {
    this.recommendationsRepository = recommendationsRepository;
    this.qdrantService = qdrantService;
    this.embeddingProviderFactory = embeddingProviderFactory;
    this.aiService = aiService;
    this.strategyRegistry = strategyRegistry;
    this.engineRegistry = engineRegistry;
    this.logger = new Logger(SmartRecommendationService.name);
  }

  getDailyRecommendations(userId, query = {}) {
    return this.getRecommendations(userId, {
      ...query,
      type: RECOMMENDATION_TYPES.DAILY,
      limit: query.limit || DEFAULT_LIMIT,
    });
  }

  getSeasonalRecommendations(userId, query = {}) {
    return this.getRecommendations(userId, {
      ...query,
      type: RECOMMENDATION_TYPES.SEASONAL,
    });
  }

  getEventRecommendations(userId, query = {}) {
    return this.getRecommendations(userId, {
      ...query,
      type: RECOMMENDATION_TYPES.EVENT,
      event: query.event || 'casual',
    });
  }

  getTrendingRecommendations(userId, query = {}) {
    return this.getRecommendations(userId, {
      ...query,
      type: RECOMMENDATION_TYPES.TRENDING,
    });
  }

  async getRecommendations(userId, query = {}) {
    const recommendationType = query.type || RECOMMENDATION_TYPES.DAILY;
    const limit = query.limit || DEFAULT_LIMIT;
    const raw = await this.recommendationsRepository.getUserSignals(userId);

    if (!canPersonalizeRecommendations(raw)) {
      return this.buildEmptyResponse(recommendationType, limit);
    }

    const context = await this.buildContext(userId, raw, {
      recommendationType,
      eventType: query.event || null,
    });

    const engine = this.engineRegistry.resolve(recommendationType);
    const vectorResults = await this.searchWithQdrant(context, limit, userId, engine);
    const postgresResults = await this.searchWithPostgres(context, limit, engine);
    let blended = dedupeProductsById(blendCandidatePools(vectorResults, postgresResults));
    blended = this.applyBudgetPreference(blended, context.budgetProfile, limit);
    blended = blended.filter((item) => isRecommendableProduct(item.product));

    let ranked = rankScoredProducts(blended, limit * 2);

    if (recommendationType === RECOMMENDATION_TYPES.DAILY) {
      ranked = blendDailyRecommendations(ranked, limit);
    } else {
      ranked = ranked.slice(0, limit);
    }

    const source = vectorResults.length && postgresResults.length
      ? RECOMMENDATION_SOURCES.HYBRID
      : vectorResults.length
        ? RECOMMENDATION_SOURCES.QDRANT
        : RECOMMENDATION_SOURCES.POSTGRESQL;

    if (ranked.length) {
      const records = buildRecommendationRecords(userId, ranked, recommendationType, context);
      await this.recommendationsRepository.replaceUserRecommendations(
        userId,
        recommendationType,
        records,
      );
    }

    return this.buildResponse(ranked, context, limit, source, recommendationType, engine);
  }

  async buildContext(userId, raw, options = {}) {
    const signals = buildUserSignals(raw);
    const budgetProfile = buildBudgetProfile({
      fashionDna: raw.fashionDna,
      signals,
      profile: raw.profile,
    });
    const behavior = buildBehaviorProfile({
      productViews: raw.productViews,
      searchHistory: raw.searchHistory,
      interactions: raw.interactions,
      wishlistItems: raw.wishlistItems,
    });

    const postgresSimilar = await this.recommendationsRepository.findSimilarUsersByTraits(
      userId,
      {
        profile: raw.profile,
        faceAnalysis: raw.faceAnalysis,
        bodyAnalysis: raw.bodyAnalysis,
        fashionDna: raw.fashionDna,
        budgetProfile,
      },
    );
    const qdrantSimilar = await this.resolveSimilarUsers(userId);
    const similarUsers = this.mergeSimilarUsers(postgresSimilar, qdrantSimilar);
    const similarUserIds = similarUsers.map((entry) => entry.userId);

    const [similarWishlist, likedInteractions] = await Promise.all([
      similarUserIds.length
        ? this.recommendationsRepository.findWishlistByUserIds(similarUserIds)
        : [],
      similarUserIds.length
        ? this.recommendationsRepository.findLikedProductsByUserIds(similarUserIds)
        : [],
    ]);

    const trendingRows = await this.recommendationsRepository.findTrendingProductViews(60);

    const context = {
      userId,
      signals,
      faceAnalysis: raw.faceAnalysis,
      bodyAnalysis: raw.bodyAnalysis,
      budgetProfile,
      behavior,
      similarUsers: buildSimilarUserProfile({
        similarUsers,
        wishlistItems: similarWishlist,
        likedProductIds: likedInteractions.map((entry) => entry.product_id),
      }),
      trending: buildTrendingProfile(trendingRows),
      seasonalContext: buildSeasonalContext(),
      eventType: options.eventType,
      recommendationType: options.recommendationType,
    };

    context.factors = buildFactorsSummary(signals, context);
    context.activeStrategies = this.strategyRegistry
      .getActive(context)
      .map((strategy) => strategy.constructor.id);

    return context;
  }

  mergeSimilarUsers(postgresMatches = [], qdrantMatches = []) {
    const merged = new Map();

    [...postgresMatches, ...qdrantMatches].forEach((entry) => {
      const userId = entry.userId || entry.user_id;
      if (!userId) {
        return;
      }

      const existing = merged.get(userId);
      const score = Number(entry.score) || 1;
      merged.set(userId, {
        userId,
        score: existing ? existing.score + score : score,
      });
    });

    return [...merged.values()].sort((left, right) => right.score - left.score);
  }

  applyBudgetPreference(items, budgetProfile, limit) {
    if (!budgetProfile?.max) {
      return items;
    }

    const inBudget = items.filter((item) => isProductInBudget(item.product, budgetProfile));
    const outOfBudget = items.filter((item) => !isProductInBudget(item.product, budgetProfile));

    if (inBudget.length >= limit) {
      return inBudget;
    }

    return [...inBudget, ...outOfBudget];
  }

  buildEmptyResponse(recommendationType, limit) {
    return {
      items: [],
      factors: null,
      empty_state: {
        message: EMPTY_STATE_MESSAGE,
        requires_profile: true,
      },
      meta: {
        total: 0,
        limit,
        recommendation_type: recommendationType,
        personalized: false,
      },
    };
  }

  async resolveSimilarUsers(userId) {
    if (!this.qdrantService.isConfigured()) {
      return [];
    }

    try {
      const vector = await this.qdrantService.getFashionDnaVector(userId);
      if (!vector) {
        return [];
      }

      return this.qdrantService.searchFashionDnaSimilar(vector, 5, {
        excludeUserId: userId,
      });
    } catch (error) {
      this.logger.warn(`Similar user lookup failed: ${error.message}`);
      return [];
    }
  }

  async searchWithQdrant(context, limit, userId, engine) {
    if (!this.qdrantService.isConfigured()) {
      return [];
    }

    try {
      const provider = this.embeddingProviderFactory.getHeuristicProvider();
      let vector = provider.embedUserSignals(context.signals);

      if (this.aiService.isConfigured()) {
        try {
          const aiResult = await this.aiService.generateRecommendations({
            profile: context.signals.profile || context.signals,
            user_id: userId,
          });
          vector = aiResult.vector;
        } catch (error) {
          this.logger.warn(`AI recommendation vector fallback: ${error.message}`);
        }
      }

      const matches = await this.qdrantService.searchSimilar(vector, limit * 2);
      if (!matches.length) {
        return [];
      }

      const products = filterRecommendableProducts(
        await this.recommendationsRepository.findProductsByIds(matches.map((match) => match.id)),
      );
      const productMap = new Map(products.map((product) => [product.id, product]));

      return matches
        .map((match) => {
          const product = productMap.get(match.id);
          if (!product) {
            return null;
          }

          const scored = engine.scoreProduct(context, product, this.strategyRegistry);
          return this.formatScoredItem(product, scored, match.score || 0, RECOMMENDATION_SOURCES.QDRANT);
        })
        .filter(Boolean);
    } catch (error) {
      this.logger.warn(`Qdrant search failed: ${error.message}`);
      return [];
    }
  }

  async searchWithPostgres(context, limit, engine) {
    if (context.recommendationType === RECOMMENDATION_TYPES.TRENDING) {
      const trendingRows = await this.recommendationsRepository.findTrendingProducts(limit * 2);
      return trendingRows
        .map((row) => row.product)
        .filter(Boolean)
        .map((product) => {
          const scored = engine.scoreProduct(context, product, this.strategyRegistry);
          return this.formatScoredItem(product, scored, 0, RECOMMENDATION_SOURCES.POSTGRESQL);
        });
    }

    const excludeIds = [
      ...context.signals.wishlistProductIds,
      ...context.behavior.viewedProductIds,
    ];

    const candidates = filterRecommendableProducts(
      await this.recommendationsRepository.findCandidateProducts(excludeIds, limit),
    );

    return candidates.map((product) => {
      const scored = engine.scoreProduct(context, product, this.strategyRegistry);
      return this.formatScoredItem(product, scored, 0, RECOMMENDATION_SOURCES.POSTGRESQL);
    });
  }

  formatScoredItem(product, scored, vectorBoost, source) {
    return {
      product,
      score: Math.min(100, Number((scored.score + vectorBoost * 5).toFixed(2))),
      scoreBreakdown: scored.scoreBreakdown,
      matched_factors: scored.matched_factors,
      explanations: scored.explanations,
      reason: buildCombinedReason(scored.explanations, scored.reason),
      source,
    };
  }

  buildResponse(items, context, limit, source, recommendationType, engine) {
    return {
      items: items.map((item) => ({
        score: item.score,
        reason: item.reason || buildCombinedReason(item.explanations),
        explanations: item.explanations || [],
        score_breakdown: item.scoreBreakdown || null,
        matched_factors: item.matched_factors,
        badges: deriveRecommendationBadges(item),
        product: formatCatalogProduct(item.product),
      })),
      factors: context.factors,
      meta: {
        total: items.length,
        limit,
        source,
        recommendation_type: recommendationType,
        engine: engine.type,
        active_strategies: context.activeStrategies,
        season: context.seasonalContext?.season || null,
        event: context.eventType || null,
        personalized: true,
      },
    };
  }

  listRecommendationTypes() {
    return this.engineRegistry.listTypes();
  }

  async indexProductForVectorSearch(product) {
    const provider = this.embeddingProviderFactory.getHeuristicProvider();
    const vector = provider.embedProduct(product);

    return this.qdrantService.upsertProductVector(product.id, vector, {
      product_id: product.id,
      sku: product.sku,
      brand: product.brand ?? product.brand_id,
      brand_id: product.brand_id ?? product.brand,
      category: product.category ?? product.category_id,
      category_id: product.category_id ?? product.category,
      subcategory: product.subcategory,
    });
  }
}
