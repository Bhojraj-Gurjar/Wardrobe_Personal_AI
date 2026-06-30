import {
  topAffinityKeys,
  resolveProductBrand,
  resolveProductCategory,
  resolveProductType,
} from '../utils';
import { resolveOnboardingBudget } from '../utils/budget-score.util';
import { buildBehaviorProfileFromInteractions } from '../utils/behavior-score.util';
import { buildSimilarUserMatchProfile } from '../utils/similar-user-score.util';
import { buildTrendingProfileFromStats } from '../utils/trending-score.util';

export function buildUserSignals({
  profile,
  fashionDna,
  wishlistItems,
  orders,
}) {
  const wishlistProductIds = wishlistItems.map((item) => item.product_id);
  const wishlistBrands = [
    ...new Set(
      wishlistItems
        .map((item) => resolveProductBrand(item.product))
        .filter(Boolean),
    ),
  ];
  const wishlistCategories = [
    ...new Set(
      wishlistItems
        .map((item) => resolveProductCategory(item.product))
        .filter(Boolean),
    ),
  ];
  const wishlistProductTypes = [
    ...new Set(
      wishlistItems
        .map((item) => resolveProductType(item.product))
        .filter(Boolean),
    ),
  ];

  const activityBrands = topAffinityKeys(
    fashionDna?.activity_traits?.favorite_brands,
    8,
  );
  const dnaBrands = topAffinityKeys(fashionDna?.brand_affinity, 8).filter(
    (brand) => brand !== 'undiscovered',
  );
  const favoriteBrands = [...new Set([...activityBrands, ...dnaBrands, ...wishlistBrands])];
  const favoriteColors = topAffinityKeys(fashionDna?.color_affinity, 6);
  const favoriteCategories = topAffinityKeys(
    fashionDna?.activity_traits?.favorite_categories,
    6,
  );
  const favoriteProductTypes = topAffinityKeys(
    fashionDna?.activity_traits?.favorite_product_types,
    8,
  );

  const orderCount = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const activityAverageSpending =
    fashionDna?.activity_traits?.average_spending;
  const avgOrderValue = activityAverageSpending
    ?? (orderCount ? totalSpent / orderCount : 0);

  return {
    profile,
    fashionDna,
    wishlistProductIds,
    wishlistBrands,
    wishlistCategories,
    wishlistProductTypes,
    favoriteBrands,
    favoriteColors,
    favoriteCategories,
    favoriteProductTypes,
    orderStats: {
      count: orderCount,
      totalSpent,
      avgOrderValue,
    },
  };
}

export function buildFactorsSummary(signals, context = {}) {
  return {
    body_type:
      context.bodyAnalysis?.bodyType
      || context.bodyAnalysis?.body_type
      || signals.profile?.body_type
      || null,
    skin_tone:
      context.faceAnalysis?.skinTone
      || context.faceAnalysis?.skin_tone
      || signals.profile?.skin_tone
      || null,
    face_shape:
      context.faceAnalysis?.faceShape
      || context.faceAnalysis?.face_shape
      || null,
    favorite_brands: signals.favoriteBrands,
    favorite_colors: signals.favoriteColors,
    shopping_history: {
      order_count: signals.orderStats.count,
      total_spent: signals.orderStats.totalSpent,
      avg_order_value: signals.orderStats.avgOrderValue,
    },
    wishlist: {
      item_count: signals.wishlistProductIds.length,
      brands: signals.wishlistBrands,
      categories: signals.wishlistCategories,
    },
    budget: context.budgetProfile || null,
    behavior: {
      viewed_products: context.behavior?.viewedProductIds?.length || 0,
      recent_searches: context.behavior?.recentSearchTerms?.length || 0,
    },
    similar_users: {
      count: context.similarUsers?.userIds?.length || 0,
    },
    recommendation_type: context.recommendationType || null,
    seasonal: context.seasonalContext?.season || null,
    event: context.eventType || null,
  };
}

export function buildBudgetProfile({ fashionDna, signals, profile }) {
  const onboardingBudget = resolveOnboardingBudget(profile, fashionDna);

  if (onboardingBudget) {
    return onboardingBudget;
  }

  const avg = signals.orderStats.avgOrderValue;
  const activityAvg = fashionDna?.activity_traits?.average_spending;
  const target = Number(activityAvg) || Number(avg) || null;

  if (!target) {
    return null;
  }

  return {
    target,
    min: Math.max(0, target * 0.5),
    max: target * 1.8,
    budgetRange: null,
    source: 'orders',
  };
}

export function buildBehaviorProfile({
  productViews = [],
  searchHistory = [],
  interactions = [],
  wishlistItems = [],
}) {
  const interactionRecords = interactions.length
    ? interactions
    : productViews.map((view) => ({
      product_id: view.product_id,
      type: 'view',
      product: view.product,
    }));

  return buildBehaviorProfileFromInteractions({
    interactions: interactionRecords,
    searchHistory,
    wishlistItems,
  });
}

export function buildSimilarUserProfile({
  similarUsers = [],
  wishlistItems = [],
  likedProductIds = [],
}) {
  return buildSimilarUserMatchProfile({
    similarUsers,
    wishlistItems,
    likedProductIds,
  });
}

export function buildTrendingProfile(trendingRows = []) {
  if (trendingRows.length && trendingRows[0]?.product_id && trendingRows[0]?.score !== undefined) {
    return buildTrendingProfileFromStats(trendingRows);
  }

  const viewCountByProductId = {};

  trendingRows.forEach((row) => {
    viewCountByProductId[row.product_id] = Number(row._count?.product_id || row.view_count || 0);
  });

  return { viewCountByProductId, statByProductId: {} };
}
