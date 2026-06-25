import { RECOMMENDATION_FACTORS } from '../types';
import { resolveProductBrand } from './recommendation-scoring.util';
import { isProductInBudget } from './budget-score.util';

export const SIMILAR_USER_SCORE_RAW_MAX = 40;

export function buildSimilarUserMatchProfile({
  similarUsers = [],
  wishlistItems = [],
  likedProductIds = [],
} = {}) {
  const userIds = similarUsers.map((entry) => entry.userId || entry.user_id).filter(Boolean);
  const productIds = [
    ...new Set([
      ...wishlistItems.map((item) => item.product_id),
      ...likedProductIds,
    ].filter(Boolean)),
  ];
  const brands = [
    ...new Set(wishlistItems.map((item) => resolveProductBrand(item.product)).filter(Boolean)),
  ];
  const categories = [
    ...new Set(
      wishlistItems
        .map((item) => item.product?.category || item.product?.subcategory)
        .filter(Boolean),
    ),
  ];

  return {
    userIds,
    productIds,
    brands,
    categories,
    matches: similarUsers,
  };
}

export function scoreSimilarUserOverlap(product, similarUsers = {}) {
  const productId = product.id;
  const brand = resolveProductBrand(product);
  const category = product.category || product.subcategory;
  let score = 0;
  const factors = [RECOMMENDATION_FACTORS.SIMILAR_USERS];

  if (similarUsers.productIds?.includes(productId)) {
    score += 28;
  }

  if (similarUsers.brands?.includes(brand)) {
    score += 12;
  }

  if (similarUsers.categories?.includes(category)) {
    score += 8;
  }

  return {
    score: Math.min(SIMILAR_USER_SCORE_RAW_MAX, score),
    factors: score > 0 ? factors : [],
  };
}

export function resolveSimilarUserScoreReason(similarUsers = {}) {
  const count = similarUsers.userIds?.length || 0;

  if (count > 0) {
    return `Popular among ${count} similar shopper${count === 1 ? '' : 's'}`;
  }

  return 'Popular among similar users';
}

export function computeSimilarUserScore(product, similarUsers = {}, budgetProfile = null) {
  if (!similarUsers?.userIds?.length) {
    return { score: 0, factors: [], breakdown: null };
  }

  const overlap = scoreSimilarUserOverlap(product, similarUsers);

  if (budgetProfile && !isProductInBudget(product, budgetProfile)) {
    return {
      score: Math.max(0, Math.round(overlap.score * 0.35)),
      factors: overlap.factors,
      breakdown: { overlap: overlap.score, budgetAdjusted: true },
    };
  }

  return {
    score: overlap.score,
    factors: overlap.factors,
    breakdown: { similarUserCount: similarUsers.userIds.length },
  };
}
