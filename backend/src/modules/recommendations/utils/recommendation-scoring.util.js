import { RECOMMENDATION_FACTORS } from '../types';

export function resolveProductBrand(product) {
  return product.brand ?? product.brand_id ?? null;
}

export function resolveProductCategory(product) {
  return product.category ?? product.category_id ?? product.subcategory ?? null;
}

export function resolveProductType(product) {
  return product.productType ?? product.product_type ?? null;
}

export function topAffinityKeys(affinityMap, limit = 5) {
  if (!affinityMap || typeof affinityMap !== 'object') {
    return [];
  }

  return Object.entries(affinityMap)
    .sort(([, left], [, right]) => Number(right) - Number(left))
    .slice(0, limit)
    .map(([key]) => key);
}

export function productMatchesColor(product, colors = []) {
  if (!colors.length) {
    return false;
  }

  const productColor = String(product.color || '').toLowerCase();
  const productName = String(product.name || '').toLowerCase();

  return colors.some((color) => {
    const key = String(color).toLowerCase();
    return productColor.includes(key) || productName.includes(key);
  });
}

export function productMatchesBudget(product, budgetProfile = {}) {
  const price = Number(product.price) || 0;
  const min = Number(budgetProfile.min);
  const max = Number(budgetProfile.max);
  const target = Number(budgetProfile.target);

  if (Number.isFinite(min) && Number.isFinite(max) && price >= min && price <= max) {
    return { matched: true, score: 22 };
  }

  if (Number.isFinite(target) && target > 0) {
    const delta = Math.abs(price - target);

    if (delta <= target * 0.25) {
      return { matched: true, score: 18 };
    }

    if (delta <= target * 0.45) {
      return { matched: true, score: 10 };
    }
  }

  return { matched: false, score: 0 };
}

export function mergeStrategyScores(strategyResults = []) {
  const matchedFactors = [];
  let totalScore = 0;

  strategyResults.forEach((result) => {
    if (!result) {
      return;
    }

    totalScore += Number(result.score) || 0;

    (result.factors || []).forEach((factor) => {
      if (!matchedFactors.includes(factor)) {
        matchedFactors.push(factor);
      }
    });
  });

  return {
    score: Number(totalScore.toFixed(2)),
    matched_factors: matchedFactors,
  };
}

export function scoreLegacyProduct(product, signals) {
  let score = 0;
  const matchedFactors = [];

  if (
    signals.profile?.body_type
    && signals.fashionDna?.fashion_confidence_score !== undefined
  ) {
    score += signals.fashionDna.fashion_confidence_score * 0.1;
    matchedFactors.push(RECOMMENDATION_FACTORS.BODY_TYPE);
  }

  if (signals.profile?.skin_tone && signals.favoriteColors?.length) {
    score += 12;
    matchedFactors.push(RECOMMENDATION_FACTORS.SKIN_TONE);
  }

  const productBrand = resolveProductBrand(product);
  const productCategory = resolveProductCategory(product);
  const productType = resolveProductType(product);

  if (productBrand && signals.favoriteBrands?.includes(productBrand)) {
    score += 30;
    matchedFactors.push(RECOMMENDATION_FACTORS.FAVORITE_BRANDS);
  }

  if (signals.favoriteColors?.length) {
    score += 10;
    matchedFactors.push(RECOMMENDATION_FACTORS.FAVORITE_COLORS);
  }

  if (
    (productType && signals.favoriteProductTypes?.includes(productType))
    || (productType && signals.wishlistProductTypes?.includes(productType))
  ) {
    score += 25;
    matchedFactors.push(RECOMMENDATION_FACTORS.WISHLIST);
  }

  if (
    (productCategory && signals.favoriteCategories?.includes(productCategory))
    || (productCategory && signals.wishlistCategories?.includes(productCategory))
  ) {
    score += 20;
    matchedFactors.push(RECOMMENDATION_FACTORS.WISHLIST);
  }

  if (signals.orderStats?.avgOrderValue > 0) {
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
    matched_factors: [...new Set(matchedFactors)],
  };
}
