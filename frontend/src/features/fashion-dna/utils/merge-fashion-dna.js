function hasEntries(value) {
  return value && typeof value === 'object' && Object.keys(value).length > 0;
}

function hasMeaningfulEntries(value) {
  if (!hasEntries(value)) {
    return false;
  }

  return Object.values(value).some((entry) => Number(entry) > 0);
}

function hasItems(value) {
  return Array.isArray(value) && value.length > 0;
}

function formatLabel(value) {
  return String(value || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatBrandName(key) {
  const normalized = String(key || '')
    .replace(/^brand[-_]/i, '')
    .replace(/[-_]/g, ' ')
    .trim();

  return normalized
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function pickObject(primary) {
  return hasMeaningfulEntries(primary) ? primary : {};
}

function pickArray(primary) {
  return hasItems(primary) ? primary : [];
}

function pickScore(primary) {
  const value = Number(primary);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
}

function pickText(primary) {
  return primary ? String(primary) : '';
}

function traitsToRows(traits) {
  if (!hasEntries(traits)) {
    return [];
  }

  return Object.entries(traits)
    .filter(([, value]) => value !== null && value !== undefined && value !== '')
    .slice(0, 6)
    .map(([key, value]) => ({
      label: formatLabel(key),
      value: Array.isArray(value) ? value.join(', ') : String(value),
    }));
}

function buildBrandList(brandAffinity, brandAffinityList) {
  if (hasItems(brandAffinityList)) {
    return brandAffinityList;
  }

  if (hasMeaningfulEntries(brandAffinity)) {
    return Object.entries(brandAffinity)
      .sort(([, left], [, right]) => right - left)
      .slice(0, 6)
      .map(([key, weight]) => ({
        key,
        name: formatBrandName(key),
        percentage: Math.round(Number(weight) * 100),
      }));
  }

  return [];
}

function buildCategories(preferenceTraits) {
  const preferred = preferenceTraits?.preferred_categories;
  if (hasItems(preferred)) {
    return preferred.map((item) => formatLabel(item));
  }

  const affinity = preferenceTraits?.category_affinity;
  if (hasEntries(affinity)) {
    return Object.entries(affinity)
      .sort(([, left], [, right]) => right - left)
      .slice(0, 5)
      .map(([key]) => formatLabel(key));
  }

  return [];
}

function buildShoppingBehaviour(preferenceTraits, activityTraits) {
  const rows = [];

  if (preferenceTraits?.shopping_frequency) {
    rows.push({
      label: 'Frequency',
      value: formatLabel(preferenceTraits.shopping_frequency),
    });
  }

  if (preferenceTraits?.budget_preference) {
    rows.push({
      label: 'Budget preference',
      value: formatLabel(preferenceTraits.budget_preference),
    });
  }

  if (activityTraits?.average_spending) {
    rows.push({
      label: 'Avg. spend',
      value: `₹${Math.round(Number(activityTraits.average_spending))}`,
    });
  }

  const volume = activityTraits?.activity_volume;
  if (volume?.orders) {
    rows.push({ label: 'Orders', value: String(volume.orders) });
  }

  if (preferenceTraits?.occupation) {
    rows.push({
      label: 'Lifestyle',
      value: formatLabel(preferenceTraits.occupation),
    });
  }

  return rows;
}

function buildWishlistActivity(activityTraits) {
  const rows = [];
  const volume = activityTraits?.activity_volume || {};

  if (volume.wishlist) {
    rows.push({ label: 'Saved items', value: String(volume.wishlist) });
  }

  if (volume.cart) {
    rows.push({ label: 'Cart items', value: String(volume.cart) });
  }

  if (volume.closet) {
    rows.push({ label: 'Closet items', value: String(volume.closet) });
  }

  const categories = activityTraits?.favorite_categories;
  if (hasEntries(categories)) {
    const topCategory = Object.entries(categories).sort(([, a], [, b]) => b - a)[0]?.[0];
    if (topCategory) {
      rows.push({ label: 'Top category', value: formatLabel(topCategory) });
    }
  }

  if (volume.product_views) {
    rows.push({ label: 'Product views', value: String(volume.product_views) });
  }

  if (volume.try_on || volume.virtual_try_on) {
    rows.push({
      label: 'Try-ons',
      value: String((volume.try_on || 0) + (volume.virtual_try_on || 0)),
    });
  }

  if (volume.saved_looks) {
    rows.push({ label: 'Saved looks', value: String(volume.saved_looks) });
  }

  if (volume.searches) {
    rows.push({ label: 'Style searches', value: String(volume.searches) });
  }

  return rows;
}

function buildRecommendedColors(topColors, colorAffinity, colorProfile) {
  if (colorProfile?.primary?.length) {
    return colorProfile.primary
      .map((entry) => formatLabel(entry?.color ?? entry?.name ?? entry))
      .filter(Boolean);
  }

  if (hasItems(topColors)) {
    return topColors.slice(0, 5).map((color) => formatLabel(color));
  }

  if (hasEntries(colorAffinity)) {
    return Object.entries(colorAffinity)
      .sort(([, left], [, right]) => right - left)
      .slice(0, 5)
      .map(([key]) => formatLabel(key));
  }

  return [];
}

function buildBrandPreferences(brandAffinityList, brandAffinity) {
  const list = buildBrandList(brandAffinity, brandAffinityList);
  if (hasItems(list)) {
    return list.map((brand) => brand.name);
  }
  return [];
}

function buildStyleKeywords(data) {
  const keywords = new Set();

  if (data.fashionPersonality) {
    keywords.add(data.fashionPersonality);
  }

  if (data.styleType) {
    keywords.add(formatLabel(data.styleType));
  }

  if (hasEntries(data.styleAttributes)) {
    Object.entries(data.styleAttributes)
      .sort(([, left], [, right]) => right - left)
      .slice(0, 3)
      .forEach(([key]) => keywords.add(key));
  }

  const preferredColors = data.preferenceTraits?.favorite_colors;
  if (hasItems(preferredColors)) {
    preferredColors.slice(0, 2).forEach((color) => keywords.add(`${formatLabel(color)} palette`));
  }

  const result = Array.from(keywords).filter(Boolean);
  return hasItems(result) ? result.slice(0, 6) : [];
}

function buildFabrics(bodyTraits) {
  const fabrics = bodyTraits?.preferred_fabrics || bodyTraits?.fabric_preferences;
  if (hasItems(fabrics)) {
    return fabrics.map((item) => formatLabel(item));
  }

  if (bodyTraits?.fabric_preference) {
    return [formatLabel(bodyTraits.fabric_preference)];
  }

  return [];
}

export function mergeFashionDna(apiData) {
  const source = apiData || {};
  const preferenceTraits = source.preferenceTraits || {};
  const activityTraits = source.activityTraits || {};

  const hasData = Boolean(
    source.styleType
    || source.fashionConfidenceScore
    || source.confidenceScore,
  );

  const confidenceScore = pickScore(
    source.confidenceScore ?? source.fashionConfidenceScore,
  );

  const brandAffinityList = buildBrandList(
    source.brandAffinity,
    source.brandAffinityList,
  );

  return {
    hasData,
    isDefault: Boolean(source.isDefault || source.preferenceTraits?.isDefault),
    ...source,
    confidenceScore,
    fashionConfidenceScore: confidenceScore,
    fashionPersonality: pickText(source.fashionPersonality),
    personalityDescription: pickText(source.personalityDescription),
    styleType: pickText(source.styleType),
    weeklyGrowth: pickScore(source.weeklyGrowth),
    styleAttributes: pickObject(source.styleAttributes),
    styleRadar: pickObject(source.styleRadar),
    historyTimeline: pickArray(source.historyTimeline),
    colorAffinity: pickObject(source.colorAffinity),
    colorProfile: source.colorProfile || null,
    topColors: pickArray(source.topColors),
    budgetRangeLabel: pickText(source.budgetRangeLabel),
    budgetType: pickText(source.budgetType),
    averageSpending: source.averageSpending ?? null,
    spendProgress: pickScore(source.spendProgress),
    brandAffinity: pickObject(source.brandAffinity),
    brandAffinityList,
    confidenceBreakdown: source.confidenceBreakdown || null,
    aiInsights: pickArray(source.aiInsights),
    styleEvolution: pickArray(source.styleEvolution),
    wardrobeBalance: source.wardrobeBalance || null,
    favoriteCategories: buildCategories(preferenceTraits),
    shoppingBehaviour: buildShoppingBehaviour(preferenceTraits, activityTraits),
    wishlistActivity: buildWishlistActivity(activityTraits),
    faceTraits: traitsToRows(source.faceTraits),
    bodyTraits: traitsToRows(source.bodyTraits),
    recommendedColors: buildRecommendedColors(source.topColors, source.colorAffinity, source.colorProfile),
    recommendedFabrics: buildFabrics(source.bodyTraits),
    brandPreferences: buildBrandPreferences(source.brandAffinityList, source.brandAffinity),
    styleKeywords: buildStyleKeywords(source),
    preferenceTraits,
    activityTraits,
    searchBehaviour: source.searchBehaviour || activityTraits.search_behaviour || null,
    shoppingInfluence: source.shoppingInfluence || activityTraits.shopping_influence || null,
    recentlyInfluenced: pickArray(source.recentlyInfluenced || activityTraits.recently_influenced),
    discountPreference: source.discountPreference || activityTraits.discount_preference || null,
    currentStyleMood: pickText(source.currentStyleMood || source.fashionPersonality),
    fashionJourney: pickArray(source.fashionJourney),
    updatedAt: source.updatedAt || null,
  };
}
