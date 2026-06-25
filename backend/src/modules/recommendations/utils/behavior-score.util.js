import { RECOMMENDATION_FACTORS } from '../types';
import { resolveProductBrand, resolveProductCategory } from './recommendation-scoring.util';

export const BEHAVIOR_SCORE_RAW_MAX = 68;

const INTERACTION_WEIGHTS = {
  view: 6,
  wishlist: 14,
  like: 10,
  purchase: 20,
  avatar_try_on: 16,
};

export function buildCategoryFrequency(interactions = []) {
  const counts = {};

  interactions.forEach((entry) => {
    const category = resolveProductCategory(entry.product);
    if (!category) {
      return;
    }

    const weight = INTERACTION_WEIGHTS[entry.type] || 4;
    counts[category] = (counts[category] || 0) + weight;
  });

  return counts;
}

export function buildBehaviorProfileFromInteractions({
  interactions = [],
  searchHistory = [],
  wishlistItems = [],
} = {}) {
  const viewedProductIds = interactions
    .filter((entry) => entry.type === 'view')
    .map((entry) => entry.product_id);
  const viewedBrands = [
    ...new Set(
      interactions
        .map((entry) => resolveProductBrand(entry.product))
        .filter(Boolean),
    ),
  ];
  const viewedCategories = Object.keys(buildCategoryFrequency(interactions));
  const recentSearchTerms = searchHistory
    .map((entry) => String(entry.query || '').trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 10);
  const wishlistProductIds = wishlistItems.map((item) => item.product_id);
  const interactedProductIds = [
    ...new Set(interactions.map((entry) => entry.product_id)),
  ];

  return {
    interactions,
    categoryFrequency: buildCategoryFrequency(interactions),
    viewedProductIds,
    viewedBrands,
    viewedCategories,
    recentSearchTerms,
    wishlistProductIds,
    interactedProductIds,
  };
}

export function resolveBehaviorScoreReason(behavior = {}) {
  const topCategory = Object.entries(behavior.categoryFrequency || {})
    .sort(([, left], [, right]) => right - left)[0]?.[0];

  if (topCategory) {
    return `Based on your interest in ${String(topCategory).replace(/_/g, ' ')}`;
  }

  return 'Based on your browsing activity';
}

export function computeBehaviorScore(product, behavior = {}) {
  if (!behavior?.interactions?.length && !behavior?.wishlistProductIds?.length) {
    return { score: 0, factors: [], breakdown: null };
  }

  let score = 0;
  const factors = [RECOMMENDATION_FACTORS.BEHAVIOR];
  const productId = product.id;
  const brand = resolveProductBrand(product);
  const category = resolveProductCategory(product);
  const nameHaystack = String(product.name || '').toLowerCase();

  const productInteractions = (behavior.interactions || []).filter(
    (entry) => entry.product_id === productId,
  );

  productInteractions.forEach((entry) => {
    score += INTERACTION_WEIGHTS[entry.type] || 4;
  });

  const categoryWeight = behavior.categoryFrequency?.[category] || 0;
  if (categoryWeight > 0) {
    score += Math.min(20, categoryWeight);
  }

  if (behavior.viewedBrands?.includes(brand)) {
    score += 10;
  }

  if (behavior.viewedCategories?.includes(category)) {
    score += 8;
  }

  const searchHits = (behavior.recentSearchTerms || []).filter(
    (term) => nameHaystack.includes(String(term).toLowerCase()),
  );

  if (searchHits.length) {
    score += Math.min(16, searchHits.length * 6);
  }

  if (behavior.wishlistProductIds?.includes(productId)) {
    score += 14;
    factors.push(RECOMMENDATION_FACTORS.WISHLIST);
  }

  const finalScore = Math.min(BEHAVIOR_SCORE_RAW_MAX, score);

  return {
    score: finalScore,
    factors: finalScore > 0 ? factors : [],
    breakdown: {
      categoryWeight,
      interactionCount: productInteractions.length,
    },
  };
}
