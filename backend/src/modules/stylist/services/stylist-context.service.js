import { Inject, Injectable } from '@nestjs/common';
import { RecommendationsRepository } from '../../recommendations/repositories/recommendations.repository';
import {
  buildBehaviorProfile,
  buildBudgetProfile,
  buildFactorsSummary,
  buildUserSignals,
} from '../../recommendations/services/recommendation-context.builder';
import { formatCatalogProduct } from '../../products/utils/product-catalog.mapper';

export @Injectable()
class StylistContextService {
  constructor(@Inject(RecommendationsRepository) recommendationsRepository) {
    this.recommendationsRepository = recommendationsRepository;
  }

  async buildUserContext(userId) {
    const raw = await this.recommendationsRepository.getUserSignals(userId);
    const signals = buildUserSignals({
      profile: raw.profile,
      fashionDna: raw.fashionDna,
      wishlistItems: raw.wishlistItems,
      orders: raw.orders,
    });

    const behavior = buildBehaviorProfile({
      productViews: raw.productViews,
      searchHistory: raw.searchHistory,
      interactions: raw.interactions,
      wishlistItems: raw.wishlistItems,
    });

    const budgetProfile = buildBudgetProfile({
      fashionDna: raw.fashionDna,
      signals,
      profile: raw.profile,
    });

    const factors = buildFactorsSummary(signals, {
      faceAnalysis: raw.faceAnalysis,
      bodyAnalysis: raw.bodyAnalysis,
      budgetProfile,
      behavior,
    });

    return {
      signals,
      factors,
      budgetProfile,
      profile: raw.profile,
      fashionDna: raw.fashionDna,
      faceAnalysis: raw.faceAnalysis,
      bodyAnalysis: raw.bodyAnalysis,
      closetItems: raw.closetItems || [],
      displayName:
        raw.profile?.name
        || raw.profile?.preferences?.display_name
        || 'there',
      styleType: raw.fashionDna?.style_type || null,
      stylePersonality: raw.fashionDna?.fashion_personality || null,
      confidenceScore: raw.fashionDna?.fashion_confidence_score || null,
    };
  }

  buildPromptContext(context) {
    const { factors, displayName, styleType, stylePersonality } = context;

    return {
      user_name: displayName,
      style_type: styleType,
      style_personality: stylePersonality,
      body_type: factors.body_type,
      skin_tone: factors.skin_tone,
      face_shape: factors.face_shape,
      body_shape: context.bodyAnalysis?.body_shape || context.bodyAnalysis?.bodyShape || null,
      style_score: context.confidenceScore,
      favorite_brands: factors.favorite_brands?.slice(0, 6) || [],
      favorite_colors: factors.favorite_colors?.slice(0, 6) || [],
      budget_avg: factors.shopping_history?.avg_order_value || null,
      wishlist_count: factors.wishlist?.item_count || 0,
    };
  }

  formatProducts(products) {
    return (products || []).map((product) => formatCatalogProduct(product));
  }
}
