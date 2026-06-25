import { RECOMMENDATION_FACTORS } from '../types';

export const SKIN_TONE_SCORE_RAW_MAX = 34;

export const WARM_PRODUCT_COLORS = [
  'olive',
  'brown',
  'beige',
  'cream',
  'mustard',
];

export const COOL_PRODUCT_COLORS = [
  'navy',
  'white',
  'grey',
  'gray',
  'black',
];

const PALETTE_MATCH_CAP = 28;
const NEUTRAL_BASE_CAP = 22;
const MULTI_MATCH_BONUS = 6;

const WARM_SKIN_TONES = ['olive', 'tan', 'brown', 'dark', 'warm'];
const COOL_SKIN_TONES = ['fair', 'light', 'cool', 'porcelain'];
const NEUTRAL_SKIN_TONES = ['medium', 'neutral'];

const COMMON_PRODUCT_COLORS = [
  ...WARM_PRODUCT_COLORS,
  ...COOL_PRODUCT_COLORS,
  'red',
  'blue',
  'green',
  'pink',
  'purple',
  'yellow',
  'orange',
  'burgundy',
  'maroon',
  'teal',
  'charcoal',
  'ivory',
  'khaki',
  'tan',
  'gold',
  'silver',
  'denim',
  'indigo',
];

function normalizeTrait(value) {
  return String(value || '').trim().toLowerCase().replace(/_/g, ' ');
}

export function resolveSkinTone(faceAnalysis = {}, profile = null) {
  return normalizeTrait(
    faceAnalysis.skinTone
    || faceAnalysis.skin_tone
    || profile?.skin_tone,
  );
}

export function resolveSkinUndertone(skinTone) {
  const normalized = normalizeTrait(skinTone);

  if (!normalized) {
    return null;
  }

  if (COOL_SKIN_TONES.some((tone) => normalized.includes(tone))) {
    return 'cool';
  }

  if (WARM_SKIN_TONES.some((tone) => normalized.includes(tone))) {
    return 'warm';
  }

  if (NEUTRAL_SKIN_TONES.some((tone) => normalized.includes(tone))) {
    return 'neutral';
  }

  return 'neutral';
}

export function buildSkinToneProductHaystack(product) {
  const styleTags = [
    ...(Array.isArray(product.style_tags) ? product.style_tags : []),
    ...(Array.isArray(product.styleTags) ? product.styleTags : []),
  ];

  return [
    product.color,
    product.name,
    product.category,
    product.subcategory,
    ...styleTags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/_/g, ' ');
}

function countPaletteHits(haystack, palette = []) {
  return palette.filter((color) => haystack.includes(color));
}

function scorePaletteMatch(haystack, palette) {
  const hits = countPaletteHits(haystack, palette);

  if (!hits.length) {
    return { score: 0, matchedColors: [] };
  }

  const perHit = Math.min(10, Math.floor(PALETTE_MATCH_CAP / Math.max(palette.length - 1, 3)));
  let score = Math.min(PALETTE_MATCH_CAP, hits.length * perHit);

  if (hits.length >= 2) {
    score = Math.min(SKIN_TONE_SCORE_RAW_MAX, score + MULTI_MATCH_BONUS);
  }

  return {
    score,
    matchedColors: hits,
  };
}

function scoreWarmUndertone(haystack) {
  return scorePaletteMatch(haystack, WARM_PRODUCT_COLORS);
}

function scoreCoolUndertone(haystack) {
  return scorePaletteMatch(haystack, COOL_PRODUCT_COLORS);
}

function scoreNeutralUndertone(haystack, product) {
  const productColor = normalizeTrait(product.color);
  const paletteHits = countPaletteHits(haystack, COMMON_PRODUCT_COLORS);

  if (paletteHits.length) {
    return {
      score: Math.min(
        NEUTRAL_BASE_CAP,
        10 + Math.min(12, paletteHits.length * 4),
      ),
      matchedColors: paletteHits,
    };
  }

  if (productColor) {
    return {
      score: 14,
      matchedColors: [productColor],
    };
  }

  if (haystack.trim()) {
    return {
      score: 8,
      matchedColors: [],
    };
  }

  return { score: 0, matchedColors: [] };
}

export function resolveSkinToneScoreReason(faceAnalysis = {}, profile = null) {
  const skinTone = resolveSkinTone(faceAnalysis, profile);
  const undertone = resolveSkinUndertone(skinTone);

  if (undertone === 'warm') {
    return 'Warm shades like olive, brown, beige, cream, and mustard complement your skin tone';
  }

  if (undertone === 'cool') {
    return 'Cool shades like navy, white, grey, and black complement your skin tone';
  }

  if (undertone === 'neutral') {
    return 'This color works well with your neutral skin undertone';
  }

  return 'Matches your skin tone';
}

/**
 * Computes raw skinToneScore from skinTone undertone and product colors.
 */
export function computeSkinToneScore(faceAnalysis, product, profile = null) {
  const skinTone = resolveSkinTone(faceAnalysis, profile);
  const undertone = resolveSkinUndertone(skinTone);

  if (!skinTone || !undertone) {
    return { score: 0, factors: [], breakdown: null };
  }

  const haystack = buildSkinToneProductHaystack(product);
  let result = { score: 0, matchedColors: [] };

  if (undertone === 'warm') {
    result = scoreWarmUndertone(haystack);
  } else if (undertone === 'cool') {
    result = scoreCoolUndertone(haystack);
  } else {
    result = scoreNeutralUndertone(haystack, product);
  }

  const score = Math.min(SKIN_TONE_SCORE_RAW_MAX, result.score);

  return {
    score,
    factors: score > 0 ? [RECOMMENDATION_FACTORS.SKIN_TONE] : [],
    breakdown: {
      undertone,
      skinTone,
      matchedColors: result.matchedColors,
    },
  };
}
