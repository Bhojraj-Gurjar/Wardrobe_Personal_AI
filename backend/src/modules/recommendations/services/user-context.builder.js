import { RECOMMENDATION_FACTORS } from '../validators/recommendation.constants';

function topAffinityKeys(affinityMap, limit = 5) {
  if (!affinityMap || typeof affinityMap !== 'object') {
    return [];
  }

  return Object.entries(affinityMap)
    .sort(([, left], [, right]) => right - left)
    .slice(0, limit)
    .map(([key]) => key);
}

function resolveProductBrand(product) {
  return product.brand ?? product.brand_id ?? null;
}

function resolveProductCategory(product) {
  return product.category ?? product.category_id ?? product.subcategory ?? null;
}

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
    favoriteBrands,
    favoriteColors,
    favoriteCategories,
    orderStats: {
      count: orderCount,
      totalSpent,
      avgOrderValue,
    },
  };
}

export function buildFactorsSummary(signals) {
  return {
    body_type: signals.profile?.body_type || null,
    skin_tone: signals.profile?.skin_tone || null,
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
  };
}

export function scoreProduct(product, signals) {
  let score = 0;
  const matchedFactors = [];

  if (
    signals.profile?.body_type &&
    signals.fashionDna?.fashion_confidence_score !== undefined
  ) {
    score += signals.fashionDna.fashion_confidence_score * 0.1;
    matchedFactors.push(RECOMMENDATION_FACTORS.BODY_TYPE);
  }

  if (signals.profile?.skin_tone && signals.favoriteColors.length) {
    score += 12;
    matchedFactors.push(RECOMMENDATION_FACTORS.SKIN_TONE);
  }

  const productBrand = resolveProductBrand(product);
  const productCategory = resolveProductCategory(product);

  if (productBrand && signals.favoriteBrands.includes(productBrand)) {
    score += 30;
    matchedFactors.push(RECOMMENDATION_FACTORS.FAVORITE_BRANDS);
  }

  if (signals.favoriteColors.length) {
    score += 10;
    matchedFactors.push(RECOMMENDATION_FACTORS.FAVORITE_COLORS);
  }

  if (
    (productCategory && signals.favoriteCategories?.includes(productCategory))
    || (productCategory && signals.wishlistCategories.includes(productCategory))
  ) {
    score += 20;
    matchedFactors.push(RECOMMENDATION_FACTORS.WISHLIST);
  }

  if (signals.orderStats.avgOrderValue > 0) {
    const priceDelta = Math.abs(
      product.price - signals.orderStats.avgOrderValue,
    );

    if (priceDelta <= signals.orderStats.avgOrderValue * 0.35) {
      score += 18;
      matchedFactors.push(RECOMMENDATION_FACTORS.SHOPPING_HISTORY);
    }
  }

  return {
    score: Number(score.toFixed(2)),
    matchedFactors: [...new Set(matchedFactors)],
  };
}
