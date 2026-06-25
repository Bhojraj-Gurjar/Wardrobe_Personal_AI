import { RECOMMENDATION_FACTORS } from '../types';
import { resolveFaceScoreReason } from './face-score.util';
import { resolveBodyScoreReason } from './body-score.util';
import { resolveSkinToneScoreReason } from './skin-tone-score.util';

const FACTOR_REASON_PRIORITY = [
  RECOMMENDATION_FACTORS.SKIN_TONE,
  RECOMMENDATION_FACTORS.BODY_TYPE,
  RECOMMENDATION_FACTORS.BUDGET,
  RECOMMENDATION_FACTORS.SIMILAR_USERS,
  RECOMMENDATION_FACTORS.FACE_SHAPE,
  RECOMMENDATION_FACTORS.SEASONAL,
  RECOMMENDATION_FACTORS.EVENT,
  RECOMMENDATION_FACTORS.TRENDING,
  RECOMMENDATION_FACTORS.BEHAVIOR,
  RECOMMENDATION_FACTORS.WISHLIST,
  RECOMMENDATION_FACTORS.FAVORITE_BRANDS,
  RECOMMENDATION_FACTORS.SHOPPING_HISTORY,
];

const STATIC_FACTOR_REASONS = {
  [RECOMMENDATION_FACTORS.SKIN_TONE]: 'Matches your skin tone',
  [RECOMMENDATION_FACTORS.BUDGET]: 'Fits your budget',
  [RECOMMENDATION_FACTORS.SIMILAR_USERS]: 'Popular among similar users',
  [RECOMMENDATION_FACTORS.FACE_SHAPE]: 'Complements your face shape',
  [RECOMMENDATION_FACTORS.HAIR_STYLE]: 'Complements your hair style',
  [RECOMMENDATION_FACTORS.BEARD_STYLE]: 'Works with your beard style',
  [RECOMMENDATION_FACTORS.SEASONAL]: 'Great for the current season',
  [RECOMMENDATION_FACTORS.EVENT]: 'Suited for your occasion',
  [RECOMMENDATION_FACTORS.TRENDING]: 'Trending right now',
  [RECOMMENDATION_FACTORS.BEHAVIOR]: 'Based on your browsing activity',
  [RECOMMENDATION_FACTORS.WISHLIST]: 'Matches items in your wishlist',
  [RECOMMENDATION_FACTORS.FAVORITE_BRANDS]: 'From brands you love',
  [RECOMMENDATION_FACTORS.SHOPPING_HISTORY]: 'Aligned with your shopping history',
  [RECOMMENDATION_FACTORS.FAVORITE_COLORS]: 'Matches your color preferences',
};

const SCORE_COMPONENT_FACTORS = [
  { key: 'skinToneScore', factor: RECOMMENDATION_FACTORS.SKIN_TONE },
  { key: 'bodyScore', factor: RECOMMENDATION_FACTORS.BODY_TYPE },
  { key: 'budgetScore', factor: RECOMMENDATION_FACTORS.BUDGET },
  { key: 'similarUserScore', factor: RECOMMENDATION_FACTORS.SIMILAR_USERS },
  { key: 'faceScore', factor: RECOMMENDATION_FACTORS.FACE_SHAPE },
  { key: 'trendScore', factor: RECOMMENDATION_FACTORS.TRENDING },
  { key: 'behaviorScore', factor: RECOMMENDATION_FACTORS.BEHAVIOR },
];

function resolveReasonForFactor(factor, context = {}) {
  if (factor === RECOMMENDATION_FACTORS.SKIN_TONE) {
    return resolveSkinToneScoreReason(
      context.faceAnalysis || {},
      context.signals?.profile,
    );
  }

  if (factor === RECOMMENDATION_FACTORS.BODY_TYPE) {
    return resolveBodyScoreReason(
      context.bodyAnalysis || {},
      context.signals?.profile,
    );
  }

  if (factor === RECOMMENDATION_FACTORS.FACE_SHAPE) {
    return resolveFaceScoreReason(context.faceAnalysis || {});
  }

  return STATIC_FACTOR_REASONS[factor] || 'Recommended for you';
}

export function buildScoreExplanations(scoreBreakdown = {}, context = {}) {
  return SCORE_COMPONENT_FACTORS
    .map(({ key, factor }) => ({
      component: key,
      score: Number(scoreBreakdown[key]) || 0,
      reason: resolveReasonForFactor(factor, context),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);
}

export function resolvePrimaryExplanation(explanations = []) {
  if (!explanations.length) {
    return 'Recommended for you';
  }

  return explanations[0].reason;
}

export function resolveRecommendationReason(matchedFactors = [], context = {}) {
  const factors = Array.isArray(matchedFactors) ? matchedFactors : [];

  for (const factor of FACTOR_REASON_PRIORITY) {
    if (!factors.includes(factor)) {
      continue;
    }

    if (factor === RECOMMENDATION_FACTORS.SKIN_TONE) {
      return resolveSkinToneScoreReason(
        context.faceAnalysis || {},
        context.signals?.profile,
      );
    }

    if (factor === RECOMMENDATION_FACTORS.BODY_TYPE) {
      return resolveBodyScoreReason(
        context.bodyAnalysis || {},
        context.signals?.profile,
      );
    }

    if (factor === RECOMMENDATION_FACTORS.FACE_SHAPE) {
      return resolveFaceScoreReason(context.faceAnalysis || {});
    }

    if (STATIC_FACTOR_REASONS[factor]) {
      return STATIC_FACTOR_REASONS[factor];
    }
  }

  return 'Recommended for you';
}

export function buildRecommendationRecords(userId, items, type, context = {}) {
  return items.map((item) => ({
    user_id: userId,
    product_id: item.product.id,
    score: Number(item.score) || 0,
    reason:
      item.reason
      || resolvePrimaryExplanation(item.explanations)
      || resolveRecommendationReason(item.matched_factors, context),
    type,
  }));
}

export function formatRecommendationRecord(record, product = null) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    userId: record.user_id,
    productId: record.product_id,
    score: record.score,
    reason: record.reason,
    type: record.type,
    createdAt: record.created_at,
    product: product || record.product || null,
  };
}
