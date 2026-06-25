import { RECOMMENDATION_FACTORS } from '../types';

export const BODY_SCORE_RAW_MAX = 36;

const BODY_TYPE_CAP = 16;
const BODY_SHAPE_CAP = 10;
const MEASUREMENT_CAP = 6;
const HEIGHT_CAP = 4;

function normalizeTrait(value) {
  return String(value || '').trim().toLowerCase().replace(/_/g, ' ');
}

function measurementValue(field) {
  if (field === null || field === undefined) {
    return null;
  }

  if (typeof field === 'object') {
    const value = field.value ?? field.normalized ?? field.cm ?? null;
    return Number(value);
  }

  const parsed = Number(field);
  return Number.isFinite(parsed) ? parsed : null;
}

export function resolveMeasurements(bodyAnalysis = {}) {
  const raw = bodyAnalysis.raw_ai_response || bodyAnalysis.rawAiResponse || {};
  const fromRaw = bodyAnalysis.measurements ?? raw.measurements ?? null;
  const resolved = typeof fromRaw === 'object' && fromRaw !== null ? { ...fromRaw } : {};

  const columnMap = {
    shoulderWidth: bodyAnalysis.shoulderWidth ?? bodyAnalysis.shoulder_width,
    chest: bodyAnalysis.chest,
    waist: bodyAnalysis.waist,
    hip: bodyAnalysis.hip,
    armLength: bodyAnalysis.armLength ?? bodyAnalysis.arm_length,
    legLength: bodyAnalysis.legLength ?? bodyAnalysis.leg_length,
    height: bodyAnalysis.height ?? bodyAnalysis.heightCm,
  };

  Object.entries(columnMap).forEach(([key, value]) => {
    if (value != null && resolved[key] == null) {
      resolved[key] = value;
    }
  });

  return Object.keys(resolved).length ? resolved : null;
}

export function resolveHeightCm(bodyAnalysis = {}) {
  const measurements = resolveMeasurements(bodyAnalysis);
  const height = measurementValue(measurements?.height)
    ?? measurementValue(bodyAnalysis.height)
    ?? measurementValue(bodyAnalysis.heightCm);

  return Number.isFinite(height) && height > 0 ? height : null;
}

export function detectBroadShoulders(bodyAnalysis = {}, measurements = null) {
  const resolved = measurements || resolveMeasurements(bodyAnalysis);
  const bodyShape = normalizeTrait(bodyAnalysis.bodyShape || bodyAnalysis.body_shape);

  if (
    bodyShape.includes('broad')
    || bodyShape.includes('inverted triangle')
    || bodyShape.includes('inverted_triangle')
  ) {
    return true;
  }

  const shoulder = measurementValue(resolved?.shoulderWidth);
  const chest = measurementValue(resolved?.chest);
  const waist = measurementValue(resolved?.waist);

  if (shoulder && waist && shoulder / waist >= 1.18) {
    return true;
  }

  if (shoulder && chest && shoulder / chest >= 0.92) {
    return true;
  }

  return false;
}

export function resolveBodyTraits(bodyAnalysis = {}, profile = null) {
  const bodyType = normalizeTrait(
    bodyAnalysis.bodyType
    || bodyAnalysis.body_type
    || profile?.body_type,
  );
  const bodyShape = normalizeTrait(bodyAnalysis.bodyShape || bodyAnalysis.body_shape);
  const measurements = resolveMeasurements(bodyAnalysis);
  const heightCm = resolveHeightCm(bodyAnalysis);

  return {
    bodyType,
    bodyShape,
    heightCm,
    measurements,
    hasBroadShoulders: detectBroadShoulders(bodyAnalysis, measurements),
  };
}

export function buildBodyProductHaystack(product) {
  const styleTags = [
    ...(Array.isArray(product.style_tags) ? product.style_tags : []),
    ...(Array.isArray(product.styleTags) ? product.styleTags : []),
  ];
  const occasionTags = [
    ...(Array.isArray(product.occasion_tags) ? product.occasion_tags : []),
    ...(Array.isArray(product.occasionTags) ? product.occasionTags : []),
  ];

  return [
    product.name,
    product.category,
    product.subcategory,
    product.fit_type,
    product.fitType,
    product.brand,
    product.fabric,
    ...styleTags,
    ...occasionTags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/_/g, ' ');
}

function resolveFitHaystack(product) {
  return String(product.fit_type || product.fitType || '').toLowerCase().replace(/_/g, ' ');
}

function includesAny(haystack, keywords = []) {
  return keywords.some((keyword) => haystack.includes(keyword));
}

function isFittedShirt(haystack) {
  return (
    haystack.includes('fitted shirt')
    || haystack.includes('fitted top')
    || haystack.includes('fitted tee')
    || (haystack.includes('fitted') && /shirt|top|tee|polo|blouse/.test(haystack))
  );
}

function scoreAthleticBodyType(bodyType, haystack, fitHaystack) {
  if (!bodyType.includes('athletic')) {
    return 0;
  }

  let score = 0;
  const combined = `${fitHaystack} ${haystack}`;

  if (includesAny(combined, ['slim fit', 'slim-fit']) || fitHaystack === 'slim') {
    score += 8;
  }

  if (isFittedShirt(haystack)) {
    score += 8;
  }

  return Math.min(BODY_TYPE_CAP, score);
}

function scoreOtherBodyType(bodyType, haystack, fitHaystack) {
  if (!bodyType || bodyType.includes('athletic')) {
    return 0;
  }

  const combined = `${fitHaystack} ${haystack}`;
  const rules = [
    {
      pattern: /slim/,
      keywords: ['slim', 'fitted', 'tailored'],
      score: 10,
    },
    {
      pattern: /muscular/,
      keywords: ['fitted', 'stretch', 'athletic', 'performance'],
      score: 10,
    },
    {
      pattern: /average/,
      keywords: ['regular', 'classic', 'standard', 'balanced'],
      score: 10,
    },
    {
      pattern: /plus|curvy/,
      keywords: ['relaxed', 'comfort', 'wrap', 'flowing'],
      score: 10,
    },
  ];

  for (const rule of rules) {
    if (!rule.pattern.test(bodyType)) {
      continue;
    }

    if (includesAny(combined, rule.keywords)) {
      return Math.min(BODY_TYPE_CAP, rule.score);
    }
  }

  return 0;
}

function scoreBodyTypeTrait(bodyType, haystack, fitHaystack) {
  if (!bodyType) {
    return { score: 0, factors: [] };
  }

  const athleticScore = scoreAthleticBodyType(bodyType, haystack, fitHaystack);
  const score = athleticScore || scoreOtherBodyType(bodyType, haystack, fitHaystack);

  return {
    score,
    factors: score > 0 ? [RECOMMENDATION_FACTORS.BODY_TYPE] : [],
  };
}

function scoreRectangleBodyShape(bodyShape, haystack) {
  if (!bodyShape.includes('rectangle') && !bodyShape.includes('rectangular')) {
    return { score: 0, factors: [] };
  }

  if (includesAny(haystack, ['layered outfit', 'layered look'])) {
    return { score: BODY_SHAPE_CAP, factors: [RECOMMENDATION_FACTORS.BODY_TYPE] };
  }

  if (includesAny(haystack, ['layered', 'layering', 'layer', 'overshirt', 'cardigan', 'vest'])) {
    return { score: Math.min(BODY_SHAPE_CAP, 8), factors: [RECOMMENDATION_FACTORS.BODY_TYPE] };
  }

  if (includesAny(haystack, ['jacket', 'hoodie', 'sweater']) && haystack.includes('layer')) {
    return { score: 6, factors: [RECOMMENDATION_FACTORS.BODY_TYPE] };
  }

  return { score: 0, factors: [] };
}

function scoreBroadShoulderTrait(hasBroadShoulders, haystack, fitHaystack) {
  if (!hasBroadShoulders) {
    return { score: 0, factors: [] };
  }

  const combined = `${fitHaystack} ${haystack}`;

  if (includesAny(combined, ['regular fit', 'regular-fit', 'classic fit'])) {
    return { score: MEASUREMENT_CAP, factors: [RECOMMENDATION_FACTORS.BODY_TYPE] };
  }

  if (fitHaystack === 'regular' || includesAny(haystack, ['regular fit', 'regular'])) {
    return { score: 5, factors: [RECOMMENDATION_FACTORS.BODY_TYPE] };
  }

  return { score: 0, factors: [] };
}

function scoreHeightTrait(heightCm, haystack) {
  if (!heightCm) {
    return { score: 0, factors: [] };
  }

  if (heightCm >= 185 && includesAny(haystack, ['tall', 'long length', 'extended length', 'long'])) {
    return { score: HEIGHT_CAP, factors: [RECOMMENDATION_FACTORS.BODY_TYPE] };
  }

  if (heightCm <= 168 && includesAny(haystack, ['petite', 'cropped', 'short length', 'ankle length'])) {
    return { score: HEIGHT_CAP, factors: [RECOMMENDATION_FACTORS.BODY_TYPE] };
  }

  if (heightCm > 168 && heightCm < 185 && includesAny(haystack, ['standard length', 'regular length'])) {
    return { score: 2, factors: [RECOMMENDATION_FACTORS.BODY_TYPE] };
  }

  return { score: 0, factors: [] };
}

function scoreMeasurementProportions(measurements, haystack, fitHaystack) {
  if (!measurements) {
    return { score: 0, factors: [] };
  }

  const legLength = measurementValue(measurements.legLength);
  const height = measurementValue(measurements.height);
  const waist = measurementValue(measurements.waist);
  const hip = measurementValue(measurements.hip);
  const combined = `${fitHaystack} ${haystack}`;
  let score = 0;

  if (legLength && height && legLength / height >= 0.48) {
    if (includesAny(haystack, ['full length', 'long inseam', 'tall'])) {
      score = Math.max(score, 3);
    }
  }

  if (waist && hip && waist / hip <= 0.78) {
    if (includesAny(combined, ['tapered', 'tailored', 'slim'])) {
      score = Math.max(score, 3);
    }
  }

  return {
    score: Math.min(MEASUREMENT_CAP, score),
    factors: score > 0 ? [RECOMMENDATION_FACTORS.BODY_TYPE] : [],
  };
}

export function resolveBodyScoreReason(bodyAnalysis = {}, profile = null) {
  const traits = resolveBodyTraits(bodyAnalysis, profile);

  if (traits.bodyType.includes('athletic')) {
    return 'Slim fit and fitted shirts work well for your athletic build';
  }

  if (traits.bodyShape.includes('rectangle') || traits.bodyShape.includes('rectangular')) {
    return 'Layered outfits flatter your rectangle body shape';
  }

  if (traits.hasBroadShoulders) {
    return 'Regular fit styles balance your broad shoulders';
  }

  if (traits.heightCm) {
    if (traits.heightCm >= 185) {
      return 'Longer lengths suit your height';
    }

    if (traits.heightCm <= 168) {
      return 'Cropped and petite-friendly styles suit your height';
    }
  }

  if (traits.bodyType) {
    const label = traits.bodyType.replace(/_/g, ' ');
    return `Recommended for ${label} body type`;
  }

  return 'Recommended for your body type';
}

/**
 * Computes raw bodyScore from bodyType, height, and measurements.
 */
export function computeBodyScore(bodyAnalysis, product, profile = null) {
  const traits = resolveBodyTraits(bodyAnalysis, profile);
  const haystack = buildBodyProductHaystack(product);
  const fitHaystack = resolveFitHaystack(product);

  if (
    !traits.bodyType
    && !traits.bodyShape
    && !traits.heightCm
    && !traits.measurements
  ) {
    return { score: 0, factors: [], breakdown: null };
  }

  const bodyTypeResult = scoreBodyTypeTrait(traits.bodyType, haystack, fitHaystack);
  const bodyShapeResult = scoreRectangleBodyShape(traits.bodyShape, haystack);
  const shoulderResult = scoreBroadShoulderTrait(
    traits.hasBroadShoulders,
    haystack,
    fitHaystack,
  );
  const heightResult = scoreHeightTrait(traits.heightCm, haystack);
  const proportionResult = scoreMeasurementProportions(
    traits.measurements,
    haystack,
    fitHaystack,
  );

  const measurementScore = Math.min(
    MEASUREMENT_CAP,
    shoulderResult.score + proportionResult.score,
  );

  const breakdown = {
    bodyType: bodyTypeResult.score,
    bodyShape: bodyShapeResult.score,
    measurements: measurementScore,
    height: heightResult.score,
  };

  const factors = [
    ...bodyTypeResult.factors,
    ...bodyShapeResult.factors.filter((factor) => !bodyTypeResult.factors.includes(factor)),
    ...shoulderResult.factors.filter((factor) => !bodyTypeResult.factors.includes(factor)),
    ...heightResult.factors.filter((factor) => !bodyTypeResult.factors.includes(factor)),
    ...proportionResult.factors.filter(
      (factor) => !bodyTypeResult.factors.includes(factor)
        && !shoulderResult.factors.includes(factor),
    ),
  ];

  const score = Math.min(
    BODY_SCORE_RAW_MAX,
    breakdown.bodyType
    + breakdown.bodyShape
    + breakdown.measurements
    + breakdown.height,
  );

  return {
    score,
    factors: [...new Set(factors)],
    breakdown,
  };
}
