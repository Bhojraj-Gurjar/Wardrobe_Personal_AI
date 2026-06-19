import {
  BODY_TYPE_LIFESTYLE_BOOST,
  BODY_TYPE_STYLE_BOOST,
  DEFAULT_COLOR_AFFINITY,
  MAX_SCORE,
  MIN_SCORE,
  SKIN_TONE_COLOR_MAP,
} from '../validators/dna.constants';

function clampScore(value) {
  return Math.min(MAX_SCORE, Math.max(MIN_SCORE, Math.round(value)));
}

function calculateAgeScore(age) {
  if (!age) {
    return 0;
  }

  if (age >= 18 && age <= 35) {
    return 10;
  }

  if (age >= 36 && age <= 50) {
    return 5;
  }

  return 0;
}

function calculateLifestyleAgeScore(age) {
  if (!age) {
    return 40;
  }

  if (age <= 30) {
    return 75;
  }

  if (age <= 45) {
    return 65;
  }

  return 55;
}

export function calculateStyleScore(profile) {
  let score = 50;

  if (profile?.body_type) {
    score += BODY_TYPE_STYLE_BOOST[profile.body_type] || 0;
  }

  score += calculateAgeScore(profile?.age);

  return clampScore(score);
}

export function calculateColorAffinity(profile) {
  const favoriteColors = profile?.preferences?.favorite_colors;

  if (Array.isArray(favoriteColors) && favoriteColors.length) {
    const weight = Number((1 / favoriteColors.length).toFixed(2));
    return favoriteColors.reduce((affinity, color) => {
      affinity[String(color).toLowerCase()] = weight;
      return affinity;
    }, {});
  }

  if (profile?.skin_tone && SKIN_TONE_COLOR_MAP[profile.skin_tone]) {
    return { ...SKIN_TONE_COLOR_MAP[profile.skin_tone] };
  }

  return { ...DEFAULT_COLOR_AFFINITY };
}

export function calculateBrandAffinity(wishlistItems, profile) {
  const favoriteBrands = profile?.preferences?.favorite_brands;

  if (Array.isArray(favoriteBrands) && favoriteBrands.length) {
    const weight = Number((1 / favoriteBrands.length).toFixed(2));
    return favoriteBrands.reduce((affinity, brand) => {
      affinity[String(brand).toLowerCase()] = weight;
      return affinity;
    }, {});
  }

  if (!wishlistItems.length) {
    return { undiscovered: 0.5 };
  }

  const brandCounts = wishlistItems.reduce((counts, item) => {
    const brandId = item.product?.brand_id;

    if (!brandId) {
      return counts;
    }

    counts[brandId] = (counts[brandId] || 0) + 1;
    return counts;
  }, {});

  const maxCount = Math.max(...Object.values(brandCounts), 1);

  return Object.entries(brandCounts).reduce((affinity, [brandId, count]) => {
    affinity[brandId] = Number((count / maxCount).toFixed(2));
    return affinity;
  }, {});
}

export function calculateLifestyleScore(profile) {
  let score = calculateLifestyleAgeScore(profile?.age);

  if (profile?.body_type) {
    score += BODY_TYPE_LIFESTYLE_BOOST[profile.body_type] || 0;
  }

  if (profile?.gender === 'MALE') {
    score += 3;
  }

  if (profile?.gender === 'FEMALE') {
    score += 5;
  }

  return clampScore(score);
}

export function buildFashionDnaPayload(profile, wishlistItems) {
  return {
    style_score: calculateStyleScore(profile),
    color_affinity: calculateColorAffinity(profile),
    brand_affinity: calculateBrandAffinity(wishlistItems, profile),
    lifestyle_score: calculateLifestyleScore(profile),
  };
}
