import { Injectable } from '@nestjs/common';
import {
  STYLE_AXES,
  aggregateStyleScoresFromInteractions,
  classifyWardrobeSlot,
  clamp,
  deriveStyleAttributesFromSignals,
  normalizeKey,
} from '../utils/fashion-dna-product-style.util';

const CONFIDENCE_WEIGHTS = {
  faceAnalysis: 15,
  bodyAnalysis: 15,
  preferenceCompleteness: 15,
  closetData: 15,
  purchaseHistory: 15,
  wishlistActivity: 10,
  tryOnUsage: 10,
  stylistInteractions: 5,
  fashionConsistency: 10,
};

const WEIGHT_TOTAL = Object.values(CONFIDENCE_WEIGHTS).reduce((sum, value) => sum + value, 0);

const BUDGET_TIERS = {
  BUDGET: { min: 500, max: 2000, label: 'Budget Shopper' },
  VALUE: { min: 2000, max: 4000, label: 'Value Shopper' },
  MID_RANGE: { min: 4000, max: 7500, label: 'Mid-Range Buyer' },
  PREMIUM: { min: 7500, max: 15000, label: 'Premium Buyer' },
  LUXURY: { min: 15000, max: 50000, label: 'Luxury Buyer' },
};

const PERSONALITY_FROM_AXES = [
  { axes: ['Minimalist'], label: 'Minimalist' },
  { axes: ['Classic'], label: 'Classic' },
  { axes: ['Casual', 'Classic'], label: 'Smart Casual' },
  { axes: ['Formal', 'Classic'], label: 'Business Casual' },
  { axes: ['Streetwear'], label: 'Streetwear' },
  { axes: ['Luxury'], label: 'Luxury' },
  { axes: ['Athleisure'], label: 'Athleisure' },
  { axes: ['Casual', 'Streetwear'], label: 'Contemporary' },
  { axes: ['Avant-garde'], label: 'Creative' },
  { axes: ['Formal'], label: 'Formal' },
  { axes: ['Streetwear', 'Avant-garde'], label: 'Edgy' },
  { axes: ['Streetwear', 'Casual'], label: 'Urban' },
];

function isFilled(value) {
  if (value === null || value === undefined || value === '') {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value).length > 0;
  }

  return true;
}

function completenessScore(values) {
  if (!values.length) {
    return 0;
  }

  const filled = values.filter(isFilled).length;
  return clamp((filled / values.length) * 100);
}

function saturatingRatio(count, target) {
  return clamp((Math.max(count, 0) / Math.max(target, 1)) * 100);
}

function formatBrandName(value) {
  return String(value || '')
    .replace(/^brand[-_]/i, '')
    .replace(/[-_]/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function resolveBudgetTier(averagePrice) {
  const price = Number(averagePrice) || 0;

  if (price <= 0) {
    return null;
  }

  if (price < BUDGET_TIERS.BUDGET.max) {
    return 'BUDGET';
  }

  if (price < BUDGET_TIERS.VALUE.max) {
    return 'VALUE';
  }

  if (price < BUDGET_TIERS.MID_RANGE.max) {
    return 'MID_RANGE';
  }

  if (price < BUDGET_TIERS.PREMIUM.max) {
    return 'PREMIUM';
  }

  return 'LUXURY';
}

function formatCurrencyRange(min, max, currency = 'INR') {
  const symbol = currency === 'USD' ? '$' : '₹';
  const format = (value) => `${symbol}${Math.round(value).toLocaleString('en-IN')}`;
  return `${format(min)} – ${format(max)}`;
}

export @Injectable()
class FashionDnaEngineService {
  computeConfidenceBreakdown(context = {}) {
    const {
      faceTraits = {},
      bodyTraits = {},
      onboarding = {},
      preferences = {},
      signals = {},
    } = context;

    const volume = signals.activityVolume || {};

    const faceScore = faceTraits?.is_face_registered || faceTraits?.face_shape
      ? clamp(
        40
        + (faceTraits?.biometric_enabled || faceTraits?.has_face_vector ? 35 : 15)
        + (Number(faceTraits?.quality_score) || 0) * 25,
      )
      : 0;

    const bodyScore = completenessScore([
      bodyTraits?.body_type || bodyTraits?.bodyType,
      bodyTraits?.body_shape || bodyTraits?.bodyShape,
      bodyTraits?.height,
      bodyTraits?.chest || bodyTraits?.measurements?.chest,
      bodyTraits?.waist || bodyTraits?.measurements?.waist,
      bodyTraits?.style_fit_hint,
    ]);

    const preferenceScore = completenessScore([
      onboarding?.gender,
      onboarding?.age,
      onboarding?.height,
      preferences?.occupation || onboarding?.occupation,
      preferences?.shopping_frequency || onboarding?.shopping_frequency,
      preferences?.budget_preference || onboarding?.budget_preference,
      preferences?.preferred_categories || onboarding?.preferred_categories,
      preferences?.favorite_colors || onboarding?.favorite_colors,
      preferences?.favorite_brands,
    ]);

    const closetScore = saturatingRatio(volume.closet || 0, 8);
    const purchaseScore = clamp(
      saturatingRatio(volume.orders || 0, 5) * 0.7
      + (signals.averageSpending ? 30 : 0),
    );
    const wishlistScore = saturatingRatio(volume.wishlist || 0, 6);
    const tryOnScore = clamp(
      saturatingRatio((volume.try_on || 0) + (volume.virtual_try_on || 0), 5) * 0.85
      + saturatingRatio(volume.saved_looks || 0, 3) * 0.15,
    );
    const stylistScore = saturatingRatio(volume.stylist_sessions || 0, 4);
    const consistencyScore = clamp(
      (Object.keys(signals.favoriteCategories || {}).length > 0 ? 35 : 0)
      + (Object.keys(signals.favoriteBrands || {}).length > 0 ? 35 : 0)
      + saturatingRatio(volume.product_views || 0, 12) * 0.3,
    );

    const components = {
      faceAnalysis: faceScore,
      bodyAnalysis: bodyScore,
      preferenceCompleteness: preferenceScore,
      closetData: closetScore,
      purchaseHistory: purchaseScore,
      wishlistActivity: wishlistScore,
      tryOnUsage: tryOnScore,
      stylistInteractions: stylistScore,
      fashionConsistency: consistencyScore,
    };

    const weightedTotal = Object.entries(CONFIDENCE_WEIGHTS).reduce(
      (sum, [key, weight]) => sum + (components[key] || 0) * (weight / WEIGHT_TOTAL),
      0,
    );

    return {
      components,
      weights: CONFIDENCE_WEIGHTS,
      score: clamp(weightedTotal),
    };
  }

  deriveStyleRadar(signals = {}) {
    const interactions = signals.productInteractions || [];

    if (interactions.length) {
      return aggregateStyleScoresFromInteractions(interactions);
    }

    return Object.fromEntries(STYLE_AXES.map((axis) => [axis, 0]));
  }

  deriveStyleAttributes(signals = {}) {
    return deriveStyleAttributesFromSignals(
      signals.productInteractions || [],
      signals,
    );
  }

  deriveFashionPersonality(styleRadar = {}, storedPersonality = null) {
    const rankedAxes = STYLE_AXES
      .map((axis) => ({ axis, score: styleRadar[axis] || 0 }))
      .sort((left, right) => right.score - left.score);

    const topAxes = rankedAxes
      .filter((entry) => entry.score >= 55)
      .slice(0, 2)
      .map((entry) => entry.axis);

    if (!topAxes.length && storedPersonality) {
      return storedPersonality;
    }

    if (!topAxes.length) {
      const fallback = rankedAxes.find((entry) => entry.score > 0);
      return fallback?.axis || 'Developing Profile';
    }

    for (const profile of PERSONALITY_FROM_AXES) {
      if (profile.axes.every((axis) => topAxes.includes(axis))) {
        if (topAxes.length > profile.axes.length) {
          const secondary = topAxes.find((axis) => !profile.axes.includes(axis));
          return secondary ? `${profile.label} + ${secondary}` : profile.label;
        }

        return profile.label;
      }
    }

    return topAxes.join(' + ');
  }

  deriveColorProfile(signals = {}, faceTraits = {}, colorAffinity = {}) {
    const colorCounts = { ...(signals.colorCounts || {}) };
    const entries = Object.entries(colorAffinity || {})
      .sort(([, left], [, right]) => right - left);

    entries.forEach(([color, weight]) => {
      colorCounts[normalizeKey(color)] = (colorCounts[normalizeKey(color)] || 0) + weight * 100;
    });

    (signals.favoriteColors || []).forEach((color) => {
      const key = normalizeKey(color);
      colorCounts[key] = (colorCounts[key] || 0) + 25;
    });

    if (faceTraits?.hair_color || faceTraits?.hairColor) {
      colorCounts[normalizeKey(faceTraits.hair_color || faceTraits.hairColor)] =
        (colorCounts[normalizeKey(faceTraits.hair_color || faceTraits.hairColor)] || 0) + 10;
    }

    const ranked = Object.entries(colorCounts)
      .sort(([, left], [, right]) => right - left);

    const total = ranked.reduce((sum, [, count]) => sum + count, 0) || 1;

    const toPercent = (colors) => colors.map(([color, count]) => ({
      color: formatBrandName(color),
      key: color,
      percentage: clamp((count / total) * 100),
    }));

    const primary = toPercent(ranked.slice(0, 3));
    const secondary = toPercent(ranked.slice(3, 5));
    const accent = toPercent(ranked.slice(5, 7));

    const avoid = ranked
      .filter(([color]) => ['neon', 'lime', 'hot-pink'].some((tone) => color.includes(tone)))
      .slice(0, 2)
      .map(([color]) => formatBrandName(color));

    return {
      primary,
      secondary,
      accent,
      avoid,
      topColors: ranked.slice(0, 5).map(([color]) => formatBrandName(color)),
    };
  }

  deriveBrandAffinityList(signals = {}, brandAffinity = {}) {
    const brandCounts = { ...(signals.brandCounts || {}) };

    Object.entries(brandAffinity || {}).forEach(([brand, weight]) => {
      const key = normalizeKey(brand);
      brandCounts[key] = (brandCounts[key] || 0) + Number(weight) * 100;
    });

    const ranked = Object.entries(brandCounts)
      .sort(([, left], [, right]) => right - left)
      .slice(0, 8);

    const total = ranked.reduce((sum, [, count]) => sum + count, 0) || 1;

    return ranked.map(([key, count]) => ({
      key,
      name: formatBrandName(key),
      percentage: clamp((count / total) * 100),
    }));
  }

  deriveBudgetProfile(signals = {}, budgetRange = null, currency = 'INR') {
    const prices = (signals.productInteractions || [])
      .map(({ product }) => Number(product?.price))
      .filter((price) => price > 0);

    const orderAverage = Number(signals.averageSpending) || 0;
    const wishlistAverage = prices.length
      ? prices.reduce((sum, price) => sum + price, 0) / prices.length
      : 0;
    const cartAverage = signals.cartAveragePrice || 0;

    const candidates = [orderAverage, wishlistAverage, cartAverage].filter((value) => value > 0);
    const averagePrice = candidates.length
      ? Math.round(candidates.reduce((sum, value) => sum + value, 0) / candidates.length)
      : null;

    const tierKey = resolveBudgetTier(averagePrice)
      || String(budgetRange || '').toUpperCase()
      || null;
    const tier = tierKey ? BUDGET_TIERS[tierKey] : null;

    return {
      budgetType: tier?.label || 'Profile building',
      budgetRangeLabel: tier
        ? formatCurrencyRange(tier.min, tier.max, currency)
        : 'Add shopping activity to refine range',
      averageSpending: averagePrice,
      spendProgress: averagePrice && tier
        ? clamp(((averagePrice - tier.min) / Math.max(tier.max - tier.min, 1)) * 100)
        : 0,
      orderAverage: orderAverage || null,
      wishlistAverage: wishlistAverage ? Math.round(wishlistAverage) : null,
      cartAverage: cartAverage ? Math.round(cartAverage) : null,
    };
  }

  deriveHistoryTimeline(historyItems = [], currentScore = 0, currentUpdatedAt = null) {
    const now = new Date();
    const months = [];

    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      months.push({
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleString('en-US', { month: 'short' }),
        date,
      });
    }

    const scoreByMonth = new Map();

    for (const item of historyItems || []) {
      const archivedAt = item.archivedAt || item.archived_at;
      const date = new Date(archivedAt);

      if (Number.isNaN(date.getTime())) {
        continue;
      }

      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const score = clamp(
        Number(item.fashionConfidenceScore ?? item.fashion_confidence_score ?? 0),
      );

      scoreByMonth.set(key, score);
    }

    const currentKey = currentUpdatedAt
      ? `${new Date(currentUpdatedAt).getFullYear()}-${new Date(currentUpdatedAt).getMonth()}`
      : `${now.getFullYear()}-${now.getMonth()}`;

    scoreByMonth.set(currentKey, clamp(Number(currentScore) || 0));

    const points = months.map((month) => ({
      month: month.label,
      score: scoreByMonth.has(month.key) ? scoreByMonth.get(month.key) : null,
    }));

    const firstKnownIndex = points.findIndex((point) => point.score !== null);

    if (firstKnownIndex === -1) {
      return points.map((point, index) => ({
        month: point.month,
        score: index === points.length - 1 ? clamp(Number(currentScore) || 0) : null,
      }));
    }

    return points.map((point, index) => {
      if (point.score !== null) {
        return point;
      }

      if (index < firstKnownIndex) {
        return { month: point.month, score: null };
      }

      return { month: point.month, score: points[firstKnownIndex].score };
    }).map((point, index, array) => {
      if (point.score !== null) {
        return point;
      }

      const next = array.slice(index).find((entry) => entry.score !== null);
      return {
        month: point.month,
        score: next?.score ?? clamp(Number(currentScore) || 0),
      };
    });
  }

  deriveStyleEvolution(signals = {}) {
    const recent = signals.recentInteractions || [];
    const baseline = signals.baselineInteractions || [];

    const recentRadar = aggregateStyleScoresFromInteractions(recent);
    const baselineRadar = aggregateStyleScoresFromInteractions(baseline);

    return STYLE_AXES
      .map((axis) => ({
        axis,
        current: recentRadar[axis] || 0,
        previous: baselineRadar[axis] || 0,
        delta: clamp((recentRadar[axis] || 0) - (baselineRadar[axis] || 0)),
      }))
      .filter((entry) => Math.abs(entry.delta) >= 3)
      .sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta))
      .slice(0, 6);
  }

  deriveWardrobeBalance(signals = {}) {
    const closetInteractions = (signals.productInteractions || [])
      .filter(({ source }) => ['closet', 'order', 'purchase'].includes(source));

    const counts = {
      tops: 0,
      bottoms: 0,
      footwear: 0,
      outerwear: 0,
      other: 0,
    };

    closetInteractions.forEach(({ product }) => {
      const slot = classifyWardrobeSlot(product);
      counts[slot] = (counts[slot] || 0) + 1;
    });

    const recommendations = [];

    if (counts.outerwear < Math.max(1, Math.round(counts.tops / 6))) {
      recommendations.push('Add outerwear layers to balance seasonal versatility.');
    }

    if (counts.footwear < Math.max(2, Math.round(counts.tops / 5))) {
      recommendations.push('Add footwear variety — formal and lifestyle pairs improve outfit coverage.');
    }

    if (counts.bottoms < Math.max(2, Math.round(counts.tops / 3))) {
      recommendations.push('Increase bottom options to match your top-heavy wardrobe mix.');
    }

    const totalItems = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const healthScore = totalItems
      ? clamp(
        100
        - Math.abs(counts.tops - counts.bottoms * 2) * 2
        - Math.max(0, 2 - counts.footwear) * 8
        - Math.max(0, 1 - counts.outerwear) * 10,
      )
      : 0;

    return {
      counts,
      healthScore,
      recommendations,
      totalItems,
    };
  }

  generateAiInsights(context = {}) {
    const { signals = {}, styleAttributes = {}, colorProfile = {}, wardrobeBalance = {} } = context;
    const insights = [];
    const volume = signals.activityVolume || {};

    if (styleAttributes.fitPreferenceLabel) {
      insights.push(`Fit preference leans toward ${styleAttributes.fitPreferenceLabel.toLowerCase()}.`);
    }

    if (styleAttributes['Color Boldness'] !== undefined) {
      const boldness = styleAttributes['Color Boldness'];
      if (boldness >= 60) {
        insights.push('You gravitate toward bold color statements in recent interactions.');
      } else if (boldness <= 35) {
        insights.push(`You choose neutral colors about ${100 - boldness}% of the time in tracked activity.`);
      }
    }

    if (wardrobeBalance.counts?.outerwear === 0 && wardrobeBalance.totalItems > 0) {
      insights.push('Your wardrobe is underrepresented in outerwear compared with tops.');
    }

    if (volume.saved_looks >= 2) {
      insights.push('You frequently save complete looks — strong outfit curation behavior detected.');
    }

    if (colorProfile.primary?.length >= 2) {
      const palette = colorProfile.primary.slice(0, 3).map((entry) => entry.color).join(', ');
      insights.push(`Primary palette centers on ${palette}.`);
    }

    const footwearCount = wardrobeBalance.counts?.footwear || 0;
    if (footwearCount >= 2 && styleAttributes['Trend Adoption'] >= 55) {
      insights.push('Footwear interactions suggest a lifestyle-sneaker preference.');
    }

    if (volume.try_on >= 2) {
      insights.push('Virtual try-on activity is shaping fit and silhouette preferences.');
    }

    if (volume.stylist_sessions >= 1) {
      insights.push('AI Stylist conversations are refining your style recommendations.');
    }

    if (!insights.length) {
      insights.push('Keep browsing, saving, and purchasing to unlock deeper fashion intelligence.');
    }

    return insights.slice(0, 6);
  }

  buildIntelligence(context = {}) {
    const confidence = this.computeConfidenceBreakdown(context);
    const styleRadar = this.deriveStyleRadar(context.signals);
    const styleAttributes = this.deriveStyleAttributes(context.signals);
    const fashionPersonality = this.deriveFashionPersonality(
      styleRadar,
      context.preferenceTraits?.fashion_personality,
    );
    const colorProfile = this.deriveColorProfile(
      context.signals,
      context.faceTraits,
      context.colorAffinity,
    );
    const brandAffinityList = this.deriveBrandAffinityList(
      context.signals,
      context.brandAffinity,
    );
    const budgetProfile = this.deriveBudgetProfile(
      context.signals,
      context.budgetRange,
      context.currency,
    );
    const styleEvolution = this.deriveStyleEvolution(context.signals);
    const wardrobeBalance = this.deriveWardrobeBalance(context.signals);
    const aiInsights = this.generateAiInsights({
      signals: context.signals,
      styleAttributes,
      colorProfile,
      wardrobeBalance,
    });

    return {
      confidenceScore: confidence.score,
      confidenceBreakdown: confidence,
      fashionPersonality,
      styleRadar,
      styleAttributes,
      colorProfile,
      brandAffinityList,
      budgetProfile,
      styleEvolution,
      wardrobeBalance,
      aiInsights,
    };
  }
}
