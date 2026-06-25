import { RECOMMENDATION_FACTORS } from '../types';

export const TREND_RAW_MAX = 35;

export function computeTrendingStatScore(stat = {}) {
  const views = Number(stat.views) || 0;
  const wishlistCount = Number(stat.wishlist_count ?? stat.wishlistCount) || 0;
  const tryOnCount = Number(stat.try_on_count ?? stat.tryOnCount) || 0;
  const storedScore = Number(stat.score) || 0;

  if (storedScore > 0) {
    return Math.min(TREND_RAW_MAX, storedScore);
  }

  const computed = views * 0.4 + wishlistCount * 1.5 + tryOnCount * 2;
  return Math.min(TREND_RAW_MAX, computed);
}

export function buildTrendingProfileFromStats(stats = []) {
  const viewCountByProductId = {};
  const statByProductId = {};

  stats.forEach((row) => {
    const productId = row.product_id || row.productId;
    viewCountByProductId[productId] = Number(row.views) || 0;
    statByProductId[productId] = row;
  });

  return { viewCountByProductId, statByProductId };
}

export function computeTrendScore(product, trending = {}) {
  const stat = trending.statByProductId?.[product.id];
  const views = trending.viewCountByProductId?.[product.id] || 0;

  if (!stat && !views) {
    return { score: 0, factors: [], breakdown: null };
  }

  const score = stat
    ? computeTrendingStatScore(stat)
    : Math.min(TREND_RAW_MAX, views * 3);

  return {
    score,
    factors: score > 0 ? [RECOMMENDATION_FACTORS.TRENDING] : [],
    breakdown: { views, wishlistCount: stat?.wishlist_count, tryOnCount: stat?.try_on_count },
  };
}

export function resolveTrendScoreReason() {
  return 'Trending right now';
}
