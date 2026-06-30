import { deriveProductBadges, normalizeMatchScore, normalizeTagList } from '@/features/products/utils/product-catalog.utils';
import {
  MATCH_FACTOR_REASONS,
  RECOMMENDATION_CATEGORY_FILTERS,
} from '../constants/recommendations.constants';
import { suggestCompleteOutfit } from '@/features/digital-avatar/utils/ai-outfit-suggest.util';
import {
  calculateOutfitTotal,
  getSelectedOutfitProducts,
  resolveOutfitCurrency,
} from '@/features/digital-avatar/utils/outfit-builder.util';

function productCategoryHaystack(product) {
  return [
    product?.category,
    product?.subcategory,
    product?.avatarCategory,
    product?.avatar_category,
    ...normalizeTagList(product?.styleTags),
    ...normalizeTagList(product?.occasionTags),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function getCurrentSeasonLabel() {
  const month = new Date().getMonth() + 1;

  if (month >= 3 && month <= 5) {
    return 'Spring';
  }

  if (month >= 6 && month <= 8) {
    return 'Summer';
  }

  if (month >= 9 && month <= 11) {
    return 'Fall';
  }

  return 'Winter';
}

function formatStyleType(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

export function filterRecommendationsByCategory(items, categoryId) {
  if (!categoryId || categoryId === 'all') {
    return items;
  }

  const filter = RECOMMENDATION_CATEGORY_FILTERS.find((entry) => entry.id === categoryId);

  if (!filter?.keywords?.length) {
    return items;
  }

  return items.filter((item) => {
    const haystack = productCategoryHaystack(item?.product);
    return filter.keywords.some((keyword) => haystack.includes(keyword));
  });
}

export function resolveRecommendationReason(item, options = {}) {
  const {
    factors = {},
    fashionDna = null,
    mode = 'daily',
  } = options;

  if (item?.reason) {
    return item.reason;
  }

  const matched = Array.isArray(item?.matched_factors) ? item.matched_factors : [];

  for (const factor of matched) {
    if (factor === 'body_type' && factors?.body_type) {
      const bodyType = formatStyleType(factors.body_type);
      return `Matches your ${bodyType} body type`;
    }

    if (factor === 'seasonal') {
      return `Recommended for ${getCurrentSeasonLabel()}`;
    }

    if (factor === 'trending') {
      return 'Trending among users like you';
    }

    if (MATCH_FACTOR_REASONS[factor]) {
      return MATCH_FACTOR_REASONS[factor];
    }
  }

  const styleType = fashionDna?.styleType || fashionDna?.style_type;
  if (styleType) {
    return `Because you like ${formatStyleType(styleType)}`;
  }

  if (Array.isArray(factors?.favorite_colors) && factors.favorite_colors.length) {
    return 'Matches your color palette';
  }

  if (mode === 'seasonal') {
    return `Recommended for ${getCurrentSeasonLabel()}`;
  }

  if (mode === 'trending') {
    return 'Trending right now';
  }

  if (mode === 'daily') {
    return 'Perfect for today';
  }

  return 'Based on your style profile';
}

export function deriveRecommendationTag(item, index) {
  const score = normalizeMatchScore(item?.score);
  const badges = deriveProductBadges(item?.product, { isBestMatch: index === 0 });

  if (index === 0 || (score != null && score >= 92)) {
    return { label: 'Perfect Match', tone: 'purple' };
  }

  if (badges.some((badge) => badge.label === "Editor's Pick")) {
    return { label: "Editor's Pick", tone: 'orange' };
  }

  if (badges.some((badge) => badge.label === 'Bestseller')) {
    return { label: 'Bestseller', tone: 'green' };
  }

  if (score != null && score >= 85) {
    return { label: 'Great Match', tone: 'purple' };
  }

  return badges[0]
    ? {
      label: badges[0].label,
      tone: badges[0].tone === 'orange' ? 'orange' : badges[0].tone === 'teal' ? 'green' : 'purple',
    }
    : null;
}

export function sortRecommendationItems(items, sortId) {
  const list = [...items];

  if (sortId === 'price_asc') {
    return list.sort(
      (left, right) => (left.product?.price ?? 0) - (right.product?.price ?? 0),
    );
  }

  if (sortId === 'price_desc') {
    return list.sort(
      (left, right) => (right.product?.price ?? 0) - (left.product?.price ?? 0),
    );
  }

  if (sortId === 'newest') {
    return list.sort(
      (left, right) =>
        new Date(right.product?.createdAt || right.product?.created_at || 0).getTime()
        - new Date(left.product?.createdAt || left.product?.created_at || 0).getTime(),
    );
  }

  return list.sort((left, right) => Number(right.score ?? 0) - Number(left.score ?? 0));
}

export function buildOutfitSuggestions({
  items = [],
  fashionDna,
  faceAnalysis,
  bodyAnalysis,
  maxOutfits = 3,
} = {}) {
  const suggestions = [];
  const excludedProductIds = new Set();

  for (let index = 0; index < maxOutfits; index += 1) {
    const pool = items.filter((entry) => !excludedProductIds.has(entry?.product?.id));

    if (pool.length < 2) {
      break;
    }

    const suggestion = suggestCompleteOutfit({
      recommendations: { items: pool },
      fashionDna,
      faceAnalysis,
      bodyAnalysis,
    });

    const selectedProducts = getSelectedOutfitProducts(suggestion.outfit);

    if (selectedProducts.length < 2) {
      break;
    }

    selectedProducts.forEach((product) => {
      if (product?.id) {
        excludedProductIds.add(product.id);
      }
    });

    const matchedScores = pool
      .filter((entry) => selectedProducts.some((product) => product.id === entry.product?.id))
      .map((entry) => normalizeMatchScore(entry.score))
      .filter((score) => score != null);

    const matchPercent = matchedScores.length
      ? Math.round(matchedScores.reduce((sum, score) => sum + score, 0) / matchedScores.length)
      : null;

    suggestions.push({
      id: `outfit-${index + 1}`,
      outfit: suggestion.outfit,
      products: selectedProducts,
      matchPercent,
      totalPrice: calculateOutfitTotal(suggestion.outfit),
      currency: resolveOutfitCurrency(suggestion.outfit),
      reason: index === 0
        ? 'A complete look built from your top matches'
        : 'Alternative outfit combination',
    });
  }

  return suggestions;
}
