import { Inject, Injectable, Logger } from '@nestjs/common';
import { ApiCacheService } from '../../../common/services/api-cache.service';
import { QdrantService } from '../../../database/qdrant.service';
import { AiService } from '../../ai/services/ai.service';
import { RecommendationsRepository } from '../repositories/recommendations.repository';
import { EmbeddingProviderFactory } from '../providers/embedding.provider';
import {
  buildFactorsSummary,
  buildUserSignals,
  scoreProduct,
} from './user-context.builder';
import { RECOMMENDATION_SOURCES } from '../validators/recommendation.constants';
import { formatCatalogProduct } from '../../products/utils/product-catalog.mapper';

export @Injectable()
class RecommendationsService {
  constructor(
    @Inject(RecommendationsRepository) recommendationsRepository,
    @Inject(QdrantService) qdrantService,
    @Inject(EmbeddingProviderFactory) embeddingProviderFactory,
    @Inject(AiService) aiService,
    @Inject(ApiCacheService) apiCacheService,
  ) {
    this.recommendationsRepository = recommendationsRepository;
    this.qdrantService = qdrantService;
    this.embeddingProviderFactory = embeddingProviderFactory;
    this.aiService = aiService;
    this.apiCacheService = apiCacheService;
    this.logger = new Logger(RecommendationsService.name);
  }

  async getRecommendations(userId, query) {
    const limit = query.limit || 12;
    const mode = query.type || 'default';
    const cacheKey = this.apiCacheService.buildKey(
      'recommendations',
      userId,
      mode,
      query.event || 'none',
      limit,
    );

    return this.apiCacheService.getOrSet(cacheKey, 300, async () => {
      const rawSignals =
        await this.recommendationsRepository.getUserSignals(userId);
      const signals = buildUserSignals(rawSignals);
      const factors = buildFactorsSummary(signals);

      let vectorResults = await this.searchWithQdrant(signals, limit * 2, userId);

      if (!vectorResults.length) {
        vectorResults = await this.searchWithPostgres(signals, limit * 2);
      }

      vectorResults = this.applyRecommendationMode(vectorResults, mode, query.event);
      vectorResults = this.deduplicateResults(vectorResults).slice(0, limit);

      return this.buildResponse(
        vectorResults,
        factors,
        limit,
        vectorResults.length ? RECOMMENDATION_SOURCES.QDRANT : RECOMMENDATION_SOURCES.POSTGRESQL,
        mode,
      );
    });
  }

  applyRecommendationMode(items, mode, event) {
    if (!items.length) {
      return items;
    }

    const boosted = items.map((item) => {
      let score = item.score;

      if (mode === 'daily') {
        score += 0.05;
      } else if (mode === 'seasonal') {
        const month = new Date().getMonth();
        const seasonalTags = month >= 3 && month <= 8
          ? ['summer', 'light', 'linen']
          : ['winter', 'layer', 'warm'];
        const tags = [
          ...(Array.isArray(item.product.style_tags) ? item.product.style_tags : []),
          item.product.category,
          item.product.subcategory,
        ].filter(Boolean).map((tag) => String(tag).toLowerCase());

        if (seasonalTags.some((tag) => tags.some((value) => value.includes(tag)))) {
          score += 0.12;
        }
      } else if (mode === 'event' && event) {
        const eventTag = String(event).toLowerCase();
        const occasions = Array.isArray(item.product.occasion_tags)
          ? item.product.occasion_tags.map((tag) => String(tag).toLowerCase())
          : [];

        if (occasions.some((tag) => tag.includes(eventTag))) {
          score += 0.15;
        }
      } else if (mode === 'trending') {
        score += (item.product.review_count || 0) / 10000;
      }

      return { ...item, score };
    });

    return boosted.sort((left, right) => right.score - left.score);
  }

  deduplicateResults(items) {
    const seen = new Set();

    return items.filter((item) => {
      if (seen.has(item.product.id)) {
        return false;
      }

      seen.add(item.product.id);
      return true;
    });
  }

  async searchWithQdrant(signals, limit, userId) {
    if (!this.qdrantService.isConfigured()) {
      return [];
    }

    try {
      const provider = this.embeddingProviderFactory.getHeuristicProvider();
      let vector = provider.embedUserSignals(signals);

      if (this.aiService.isConfigured()) {
        try {
          const aiResult = await this.aiService.generateRecommendations({
            profile: signals.profile || signals,
            user_id: userId,
          });
          vector = aiResult.vector;
        } catch (error) {
          this.logger.warn(
            `AI recommendation vector fallback: ${error.message}`,
          );
        }
      }

      const matches = await this.qdrantService.searchSimilar(vector, limit);

      if (!matches.length) {
        return [];
      }

      const products = await this.recommendationsRepository.findProductsByIds(
        matches.map((match) => match.id),
      );
      const productMap = new Map(
        products.map((product) => [product.id, product]),
      );

      return matches
        .map((match) => {
          const product = productMap.get(match.id);

          if (!product) {
            return null;
          }

          const { matchedFactors } = scoreProduct(product, signals);

          return {
            product,
            score: Number(match.score.toFixed(4)),
            matched_factors: matchedFactors,
          };
        })
        .filter(Boolean);
    } catch (error) {
      this.logger.warn(
        `Qdrant search failed, falling back to PostgreSQL: ${error.message}`,
      );
      return [];
    }
  }

  async searchWithPostgres(signals, limit) {
    const candidates =
      await this.recommendationsRepository.findCandidateProducts(
        signals.wishlistProductIds,
        limit,
      );

    return candidates
      .map((product) => {
        const { score, matchedFactors } = scoreProduct(product, signals);

        return {
          product,
          score,
          matched_factors: matchedFactors,
        };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);
  }

  buildResponse(items, factors, limit, source, mode = 'default') {
    return {
      items: items.map((item) => ({
        score: item.score,
        matched_factors: item.matched_factors,
        product: this.formatProduct(item.product),
      })),
      factors,
      meta: {
        total: items.length,
        limit,
        source,
        mode,
      },
    };
  }

  formatProduct(product) {
    return formatCatalogProduct(product);
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
