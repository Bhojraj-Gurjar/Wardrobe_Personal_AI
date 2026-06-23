import { Inject, Injectable, Logger } from '@nestjs/common';
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
  constructor(@Inject(RecommendationsRepository) recommendationsRepository, @Inject(QdrantService) qdrantService, @Inject(EmbeddingProviderFactory) embeddingProviderFactory, @Inject(AiService) aiService) {
    this.recommendationsRepository = recommendationsRepository;
    this.qdrantService = qdrantService;
    this.embeddingProviderFactory = embeddingProviderFactory;
    this.aiService = aiService;
    this.logger = new Logger(RecommendationsService.name);
  }

  async getRecommendations(userId, query) {
    const rawSignals =
      await this.recommendationsRepository.getUserSignals(userId);
    const signals = buildUserSignals(rawSignals);
    const factors = buildFactorsSummary(signals);

    const vectorResults = await this.searchWithQdrant(signals, query.limit, userId);

    if (vectorResults.length) {
      return this.buildResponse(
        vectorResults,
        factors,
        query.limit,
        RECOMMENDATION_SOURCES.QDRANT,
      );
    }

    const postgresResults = await this.searchWithPostgres(signals, query.limit);

    return this.buildResponse(
      postgresResults,
      factors,
      query.limit,
      RECOMMENDATION_SOURCES.POSTGRESQL,
    );
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

  buildResponse(items, factors, limit, source) {
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
