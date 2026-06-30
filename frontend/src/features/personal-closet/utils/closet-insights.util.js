const FORMAL_CATEGORIES = new Set(['suits', 'formal', 'blazers', 'dress shirts', 'formal pants']);
const CASUAL_CATEGORIES = new Set(['t-shirts', 'jeans', 'shorts', 'joggers', 'hoodies']);
const STREETWEAR_CATEGORIES = new Set(['sneakers', 'jackets', 'cargo', 'streetwear']);
const MINIMAL_CATEGORIES = new Set(['basics', 'neutral', 'minimal', 'essentials']);

function normalizeCategory(value) {
  return String(value || '').trim().toLowerCase();
}

function classifyCategory(category) {
  const key = normalizeCategory(category);

  if (FORMAL_CATEGORIES.has(key) || key.includes('formal') || key.includes('suit')) {
    return 'formal';
  }

  if (STREETWEAR_CATEGORIES.has(key) || key.includes('street') || key.includes('sneaker')) {
    return 'streetwear';
  }

  if (MINIMAL_CATEGORIES.has(key) || key.includes('basic') || key.includes('neutral')) {
    return 'minimal';
  }

  if (CASUAL_CATEGORIES.has(key) || key.includes('casual') || key.includes('tee')) {
    return 'casual';
  }

  return 'casual';
}

function getSeasonFromDate(date) {
  if (!date) {
    return 'All Season';
  }

  const month = date.getMonth();

  if (month >= 2 && month <= 4) {
    return 'Spring';
  }

  if (month >= 5 && month <= 7) {
    return 'Summer';
  }

  if (month >= 8 && month <= 10) {
    return 'Fall';
  }

  return 'Winter';
}

export function deriveClosetValue(outfits = [], purchasedItems = []) {
  const outfitTotal = outfits.reduce((sum, outfit) => sum + (Number(outfit.totalPrice) || 0), 0);
  const purchaseTotal = purchasedItems.reduce((sum, item) => sum + (Number(item.price) || 0), 0);

  return outfitTotal + purchaseTotal;
}

export function deriveAverageOutfitMatch(outfits = []) {
  if (!outfits.length) {
    return 0;
  }

  const scores = outfits.map((outfit) => {
    const base = 68 + ((outfit.productCount || outfit.items?.length || 1) * 5);
    const sourceBoost = outfit.source?.includes('try-on') ? 8 : 4;
    return Math.min(98, base + sourceBoost);
  });

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

export function deriveLastUpdated(outfits = [], purchasedItems = []) {
  const timestamps = [
    ...outfits.map((outfit) => outfit.updatedAt || outfit.createdAt),
    ...purchasedItems.map((item) => item.purchasedAt),
  ]
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));

  if (!timestamps.length) {
    return null;
  }

  return new Date(Math.max(...timestamps));
}

export function deriveClosetInsights({
  outfits = [],
  brands = [],
  colors = [],
  purchasedItems = [],
}) {
  const styleBuckets = { formal: 0, casual: 0, minimal: 0, streetwear: 0 };
  const seasonBuckets = { Spring: 0, Summer: 0, Fall: 0, Winter: 0, 'All Season': 0 };
  const categories = new Set();

  purchasedItems.forEach((item) => {
    if (item.category) {
      categories.add(item.category);
      styleBuckets[classifyCategory(item.category)] += 1;
    }

    const season = getSeasonFromDate(item.purchasedAt ? new Date(item.purchasedAt) : null);
    seasonBuckets[season] += 1;
  });

  outfits.forEach((outfit) => {
    (outfit.items || []).forEach((item) => {
      const category = item.category || item.categoryName;
      if (category) {
        categories.add(category);
        styleBuckets[classifyCategory(category)] += 1;
      }
    });

    const season = getSeasonFromDate(outfit.createdAt ? new Date(outfit.createdAt) : null);
    seasonBuckets[season] += 1;
  });

  const totalStyle = Object.values(styleBuckets).reduce((sum, count) => sum + count, 0) || 1;
  const totalSeason = Object.values(seasonBuckets).reduce((sum, count) => sum + count, 0) || 1;

  const topBrand = [...brands].sort((a, b) => (b.interactionCount || 0) - (a.interactionCount || 0))[0];
  const topColor = [...colors].sort((a, b) => (b.usagePercent || 0) - (a.usagePercent || 0))[0];
  const closetValue = deriveClosetValue(outfits, purchasedItems);
  const luxuryScore = Math.min(99, Math.round(40 + Math.log10(closetValue + 1) * 18));

  return {
    mostWornColor: topColor?.colorName || '—',
    favoriteBrand: topBrand?.brandName || '—',
    luxuryScore,
    wardrobeDiversity: categories.size,
    styleMix: {
      formal: Math.round((styleBuckets.formal / totalStyle) * 100),
      casual: Math.round((styleBuckets.casual / totalStyle) * 100),
      minimal: Math.round((styleBuckets.minimal / totalStyle) * 100),
      streetwear: Math.round((styleBuckets.streetwear / totalStyle) * 100),
    },
    seasonDistribution: {
      Spring: Math.round((seasonBuckets.Spring / totalSeason) * 100),
      Summer: Math.round((seasonBuckets.Summer / totalSeason) * 100),
      Fall: Math.round((seasonBuckets.Fall / totalSeason) * 100),
      Winter: Math.round((seasonBuckets.Winter / totalSeason) * 100),
    },
  };
}

export function deriveRecentActivity(outfits = [], purchasedItems = []) {
  const events = [];

  outfits.forEach((outfit) => {
    if (!outfit.createdAt) {
      return;
    }

    events.push({
      id: `outfit-saved-${outfit.id}`,
      type: 'saved',
      label: 'Saved Outfit',
      title: outfit.name || 'Saved look',
      timestamp: outfit.createdAt,
    });
  });

  purchasedItems.forEach((item) => {
    if (!item.purchasedAt) {
      return;
    }

    events.push({
      id: `purchase-${item.id}`,
      type: 'purchased',
      label: 'Purchased',
      title: item.name || 'Wardrobe item',
      timestamp: item.purchasedAt,
    });
  });

  return events
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 8);
}

export function deriveOutfitBadges(outfit) {
  const created = outfit.createdAt ? new Date(outfit.createdAt) : null;
  const daysOld = created ? (Date.now() - created.getTime()) / 86400000 : 999;
  const matchScore = Math.min(
    98,
    72 + ((outfit.productCount || outfit.items?.length || 1) * 6),
  );

  return {
    matchScore,
    isLuxury: (Number(outfit.totalPrice) || 0) >= 3000,
    isNew: daysOld < 7,
    isTrending: daysOld < 30,
    season: getSeasonFromDate(created),
  };
}

export function deriveOutfitOccasion(outfit) {
  const categories = (outfit.items || [])
    .map((item) => normalizeCategory(item.category || item.categoryName))
    .filter(Boolean);

  if (categories.some((category) => category.includes('formal') || category.includes('suit'))) {
    return 'Formal';
  }

  if (categories.some((category) => category.includes('sport') || category.includes('gym'))) {
    return 'Active';
  }

  if (categories.some((category) => category.includes('party') || category.includes('evening'))) {
    return 'Evening';
  }

  return 'Everyday';
}

export function deriveOutfitColorPalette(outfit) {
  const colors = (outfit.items || [])
    .map((item) => item.color)
    .filter(Boolean)
    .slice(0, 4);

  if (colors.length) {
    return colors;
  }

  return ['#1F2937', '#6B7280', '#9CA3AF'];
}

export function filterOutfitBySeason(outfit, season) {
  if (!season) {
    return true;
  }

  const created = outfit.createdAt ? new Date(outfit.createdAt) : null;
  return getSeasonFromDate(created) === season;
}

export function filterOutfitByOccasion(outfit, occasion) {
  if (!occasion) {
    return true;
  }

  return deriveOutfitOccasion(outfit).toLowerCase() === occasion.toLowerCase();
}
