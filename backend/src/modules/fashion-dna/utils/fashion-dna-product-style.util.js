const STYLE_AXES = [
  'Minimalist',
  'Classic',
  'Streetwear',
  'Formal',
  'Casual',
  'Avant-garde',
  'Athleisure',
  'Luxury',
];

const SUBCATEGORY_STYLE_WEIGHTS = {
  shirts: { Formal: 0.75, Classic: 0.85 },
  'men-shirts': { Formal: 0.75, Classic: 0.85 },
  't-shirts': { Casual: 0.9, Streetwear: 0.45 },
  'men-t-shirts': { Casual: 0.9, Streetwear: 0.45 },
  jackets: { Classic: 0.7, Formal: 0.55, Luxury: 0.35 },
  'men-jackets': { Classic: 0.7, Formal: 0.55, Luxury: 0.35 },
  pants: { Casual: 0.65, Classic: 0.45 },
  'men-jeans': { Casual: 0.8, Streetwear: 0.55 },
  'men-trousers': { Formal: 0.7, Classic: 0.65 },
  shoes: { Casual: 0.55, Athleisure: 0.45 },
  sneakers: { Streetwear: 0.75, Athleisure: 0.85, Casual: 0.5 },
  footwear: { Classic: 0.45, Luxury: 0.35 },
  sandals: { Casual: 0.8 },
  sportswear: { Athleisure: 0.9, Streetwear: 0.55 },
  athleisure: { Athleisure: 0.95, Casual: 0.6 },
  formal: { Formal: 1, Classic: 0.7, Luxury: 0.4 },
  luxury: { Luxury: 0.95, Classic: 0.65, Minimalist: 0.35 },
  minimalist: { Minimalist: 1 },
  streetwear: { Streetwear: 1, Casual: 0.45 },
  business: { Formal: 0.8, Classic: 0.75 },
  workwear: { Classic: 0.7, Casual: 0.4 },
  outerwear: { Classic: 0.55, Casual: 0.45 },
  accessories: { Classic: 0.35, Minimalist: 0.3 },
};

const CATEGORY_STYLE_WEIGHTS = {
  formal: { Formal: 0.9, Classic: 0.7, Luxury: 0.35 },
  casual: { Casual: 0.9, Streetwear: 0.35 },
  luxury: { Luxury: 0.95, Classic: 0.6 },
  sportswear: { Athleisure: 0.85, Streetwear: 0.5 },
  streetwear: { Streetwear: 0.95, Casual: 0.45 },
};

const FIT_TYPE_SIGNALS = {
  slim: { Minimalist: 0.4, Formal: 0.25 },
  regular: { Classic: 0.35, Casual: 0.3 },
  relaxed: { Casual: 0.45, Athleisure: 0.25 },
  oversized: { Streetwear: 0.55, 'Avant-garde': 0.35 },
  athletic: { Athleisure: 0.6, Streetwear: 0.25 },
  tailored: { Formal: 0.55, Classic: 0.45, Luxury: 0.25 },
};

const NEUTRAL_COLORS = new Set([
  'black',
  'white',
  'navy',
  'grey',
  'gray',
  'beige',
  'cream',
  'charcoal',
  'ecru',
  'brown',
  'tan',
  'olive',
  'slate',
]);

const BOLD_COLORS = new Set([
  'red',
  'yellow',
  'orange',
  'pink',
  'purple',
  'neon',
  'lime',
  'magenta',
  'coral',
]);

const WARDROBE_SLOTS = {
  tops: ['shirts', 'men-shirts', 't-shirts', 'men-t-shirts', 'shirt', 'top'],
  bottoms: ['pants', 'men-jeans', 'men-trousers', 'trousers', 'jeans'],
  footwear: ['shoes', 'sneakers', 'footwear', 'sandals'],
  outerwear: ['jackets', 'men-jackets', 'jacket', 'outerwear', 'coat'],
};

function normalizeKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-');
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function resolveProductStyleWeights(product) {
  const weights = {};
  const subcategory = normalizeKey(product?.subcategory);
  const category = normalizeKey(product?.category);
  const fitType = normalizeKey(product?.fit_type || product?.fitType);

  const subcategoryWeights = SUBCATEGORY_STYLE_WEIGHTS[subcategory] || {};
  const categoryWeights = CATEGORY_STYLE_WEIGHTS[category] || {};
  const fitWeights = FIT_TYPE_SIGNALS[fitType] || {};

  for (const [axis, weight] of Object.entries(subcategoryWeights)) {
    weights[axis] = (weights[axis] || 0) + weight;
  }

  for (const [axis, weight] of Object.entries(categoryWeights)) {
    weights[axis] = (weights[axis] || 0) + weight * 0.65;
  }

  for (const [axis, weight] of Object.entries(fitWeights)) {
    weights[axis] = (weights[axis] || 0) + weight * 0.5;
  }

  const styleTags = Array.isArray(product?.style_tags)
    ? product.style_tags
    : [];

  styleTags.forEach((tag) => {
    const key = normalizeKey(tag);

    if (STYLE_AXES.includes(tag)) {
      weights[tag] = (weights[tag] || 0) + 0.75;
      return;
    }

    const mapped = SUBCATEGORY_STYLE_WEIGHTS[key] || CATEGORY_STYLE_WEIGHTS[key];

    if (mapped) {
      for (const [axis, weight] of Object.entries(mapped)) {
        weights[axis] = (weights[axis] || 0) + weight * 0.5;
      }
    }
  });

  return weights;
}

export function aggregateStyleScoresFromInteractions(interactions = []) {
  const totals = Object.fromEntries(STYLE_AXES.map((axis) => [axis, 0]));

  interactions.forEach(({ product, weight = 1 }) => {
    if (!product) {
      return;
    }

    const styleWeights = resolveProductStyleWeights(product);

    for (const [axis, axisWeight] of Object.entries(styleWeights)) {
      totals[axis] = (totals[axis] || 0) + axisWeight * weight;
    }
  });

  const maxScore = Math.max(...Object.values(totals), 0.01);

  return Object.fromEntries(
    STYLE_AXES.map((axis) => [axis, clamp((totals[axis] / maxScore) * 100)]),
  );
}

export function deriveStyleAttributesFromSignals(interactions = [], signals = {}) {
  const prices = interactions
    .map(({ product }) => Number(product?.price))
    .filter((price) => price > 0);
  const fitCounts = {};
  const colorCounts = {};
  const brandSet = new Set();
  let boldColors = 0;
  let neutralColors = 0;
  let totalColors = 0;

  interactions.forEach(({ product, weight = 1 }) => {
    const fit = normalizeKey(product?.fit_type || product?.fitType || 'regular');
    fitCounts[fit] = (fitCounts[fit] || 0) + weight;

    const color = normalizeKey(product?.color);
    if (color) {
      colorCounts[color] = (colorCounts[color] || 0) + weight;
      totalColors += weight;
      if (NEUTRAL_COLORS.has(color)) {
        neutralColors += weight;
      }
      if (BOLD_COLORS.has(color)) {
        boldColors += weight;
      }
    }

    if (product?.brand) {
      brandSet.add(normalizeKey(product.brand));
    }
  });

  const topFit = Object.entries(fitCounts).sort(([, a], [, b]) => b - a)[0];
  const fitPreferenceScore = topFit
    ? clamp((topFit[1] / Math.max(interactions.length, 1)) * 100)
    : 0;
  const fitPreferenceLabel = topFit
    ? `${topFit[0].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} fit`
    : 'Balanced fit';

  const colorBoldness = totalColors
    ? clamp((boldColors / totalColors) * 100)
    : clamp((1 - (neutralColors / Math.max(totalColors, 1))) * 100);

  const uniqueCategories = new Set(
    interactions.map(({ product }) => normalizeKey(product?.subcategory || product?.category)),
  ).size;
  const experimentationScore = clamp(
    (uniqueCategories / Math.max(interactions.length, 1)) * 140
    + (signals.activityVolume?.try_on || 0) * 4,
  );

  const radar = aggregateStyleScoresFromInteractions(interactions);
  const formalness = radar.Formal ?? 0;
  const trendAdoption = clamp(
    ((radar.Streetwear || 0) * 0.45)
    + ((radar['Avant-garde'] || 0) * 0.35)
    + (signals.activityVolume?.try_on || 0) * 3,
  );

  const avgPrice = prices.length
    ? prices.reduce((sum, price) => sum + price, 0) / prices.length
    : 0;
  const priceSpread = prices.length > 1
    ? Math.max(...prices) - Math.min(...prices)
    : 0;
  const brandOrientation = clamp(
    (brandSet.size / Math.max(interactions.length, 1)) * 120
    + (Object.keys(signals.favoriteBrands || {}).length > 0 ? 15 : 0),
  );

  const patternPreference = clamp(
    (radar['Avant-garde'] || 0) * 0.35
    + experimentationScore * 0.25
    + (signals.activityVolume?.saved_looks || 0) * 5,
  );

  const seasonalAdaptability = clamp(
    ((radar.Casual || 0) * 0.25)
    + ((radar.Classic || 0) * 0.25)
    + ((radar.Formal || 0) * 0.2)
    + ((radar.Athleisure || 0) * 0.15)
    + (uniqueCategories * 8),
  );

  return {
    'Fit Preference': fitPreferenceScore,
    fitPreferenceLabel,
    'Color Boldness': colorBoldness,
    'Pattern Preference': patternPreference,
    Formalness: formalness,
    'Brand Orientation': brandOrientation,
    'Trend Adoption': trendAdoption,
    'Seasonal Adaptability': seasonalAdaptability,
    'Experimentation Score': experimentationScore,
    averagePrice: avgPrice ? Math.round(avgPrice) : null,
    priceSpread: priceSpread ? Math.round(priceSpread) : null,
    dominantColors: Object.entries(colorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([color]) => color),
  };
}

export function classifyWardrobeSlot(product) {
  const subcategory = normalizeKey(product?.subcategory);
  const category = normalizeKey(product?.category);

  for (const [slot, keywords] of Object.entries(WARDROBE_SLOTS)) {
    if (keywords.some((keyword) => subcategory.includes(keyword) || category.includes(keyword))) {
      return slot;
    }
  }

  return 'other';
}

export { STYLE_AXES, NEUTRAL_COLORS, BOLD_COLORS, normalizeKey, clamp };
