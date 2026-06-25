import { RECOMMENDATION_FACTORS } from '../types';

export const FACE_SCORE_RAW_MAX = 30;

const FACE_SHAPE_CAPS = {
  oval: 16,
  round: 14,
  square: 14,
};

const HAIR_STYLE_CAP = 8;
const BEARD_STYLE_CAP = 6;

function normalizeTrait(value) {
  return String(value || '').trim().toLowerCase().replace(/_/g, ' ');
}

export function resolveFaceTraits(faceAnalysis = {}) {
  return {
    faceShape: normalizeTrait(faceAnalysis.faceShape || faceAnalysis.face_shape),
    hairStyle: normalizeTrait(faceAnalysis.hairStyle || faceAnalysis.hair_style),
    beardStyle: normalizeTrait(
      faceAnalysis.beardStyle
      || faceAnalysis.beardType
      || faceAnalysis.beard_type,
    ),
  };
}

export function buildFaceProductHaystack(product) {
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
    ...styleTags,
    ...occasionTags,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/_/g, ' ');
}

function includesAny(haystack, keywords = []) {
  return keywords.some((keyword) => haystack.includes(keyword));
}

function isClassicShirt(haystack) {
  return (
    haystack.includes('classic shirt')
    || haystack.includes('classic oxford')
    || haystack.includes('oxford shirt')
    || (
      haystack.includes('classic')
      && /shirt|oxford|button.?down|dress shirt|formal shirt/.test(haystack)
    )
  );
}

function scoreOvalFace(haystack) {
  let score = 0;

  if (isClassicShirt(haystack)) {
    score += 6;
  }

  if (includesAny(haystack, ['blazer', 'blazers'])) {
    score += 6;
  }

  if (includesAny(haystack, ['v-neck', 'v neck', 'vneck'])) {
    score += 5;
  }

  return Math.min(FACE_SHAPE_CAPS.oval, score);
}

function scoreRoundFace(haystack) {
  if (
    includesAny(haystack, ['structured'])
    && includesAny(haystack, ['jacket', 'coat', 'blazer', 'outerwear'])
  ) {
    return FACE_SHAPE_CAPS.round;
  }

  if (includesAny(haystack, ['structured jacket', 'structured coat', 'structured blazer'])) {
    return FACE_SHAPE_CAPS.round;
  }

  if (includesAny(haystack, ['structured'])) {
    return 8;
  }

  return 0;
}

function scoreSquareFace(haystack) {
  let score = 0;

  if (includesAny(haystack, ['minimalist', 'minimal', 'minimalism'])) {
    score += 10;
  }

  if (includesAny(haystack, ['clean lines', 'clean-line', 'simple', 'understated'])) {
    score += 5;
  }

  return Math.min(FACE_SHAPE_CAPS.square, score);
}

function scoreFaceShapeTrait(faceShape, haystack) {
  if (!faceShape) {
    return { score: 0, factors: [] };
  }

  let score = 0;

  if (faceShape.includes('oval')) {
    score = scoreOvalFace(haystack);
  } else if (faceShape.includes('round')) {
    score = scoreRoundFace(haystack);
  } else if (faceShape.includes('square')) {
    score = scoreSquareFace(haystack);
  }

  return {
    score,
    factors: score > 0 ? [RECOMMENDATION_FACTORS.FACE_SHAPE] : [],
  };
}

const HAIR_STYLE_RULES = [
  {
    pattern: /short|buzz|cropped|fade|crew cut/,
    keywords: ['sporty', 'athletic', 'fitted', 'performance', 'active'],
    score: 6,
  },
  {
    pattern: /wave|wavy|curly|natural|afro|coily/,
    keywords: ['relaxed', 'soft', 'flowing', 'comfort', 'casual'],
    score: 6,
  },
  {
    pattern: /straight|sleek|fine|smooth/,
    keywords: ['tailored', 'structured', 'classic', 'sharp', 'polished'],
    score: 6,
  },
  {
    pattern: /long|layered|lob/,
    keywords: ['layered', 'cardigan', 'open', 'overshirt', 'drape'],
    score: 5,
  },
];

function scoreHairStyleTrait(hairStyle, haystack) {
  if (!hairStyle) {
    return { score: 0, factors: [] };
  }

  for (const rule of HAIR_STYLE_RULES) {
    if (!rule.pattern.test(hairStyle)) {
      continue;
    }

    if (includesAny(haystack, rule.keywords)) {
      return {
        score: Math.min(HAIR_STYLE_CAP, rule.score),
        factors: [RECOMMENDATION_FACTORS.HAIR_STYLE],
      };
    }
  }

  return { score: 0, factors: [] };
}

const BEARD_STYLE_RULES = [
  {
    pattern: /full|thick|heavy|long beard/,
    keywords: ['v-neck', 'v neck', 'open collar', 'crew neck', 'henley'],
    score: 5,
  },
  {
    pattern: /clean|none|shaven|clean-shaven|no beard/,
    keywords: ['minimalist', 'minimal', 'sharp', 'tailored', 'sleek'],
    score: 5,
  },
  {
    pattern: /stubble|goatee|short beard/,
    keywords: ['smart casual', 'casual', 'everyday', 'relaxed'],
    score: 4,
  },
];

function scoreBeardStyleTrait(beardStyle, haystack) {
  if (!beardStyle) {
    return { score: 0, factors: [] };
  }

  const normalized = (
    beardStyle.includes('none')
    || beardStyle.includes('no beard')
    || beardStyle.includes('clean shaven')
  )
    ? 'clean shaven'
    : beardStyle;

  for (const rule of BEARD_STYLE_RULES) {
    if (!rule.pattern.test(normalized)) {
      continue;
    }

    if (includesAny(haystack, rule.keywords)) {
      return {
        score: Math.min(BEARD_STYLE_CAP, rule.score),
        factors: [RECOMMENDATION_FACTORS.BEARD_STYLE],
      };
    }
  }

  return { score: 0, factors: [] };
}

export function resolveFaceScoreReason(faceAnalysis = {}) {
  const { faceShape, hairStyle, beardStyle } = resolveFaceTraits(faceAnalysis);

  if (faceShape.includes('oval')) {
    return 'Classic shirts, blazers, and v-neck styles suit your oval face';
  }

  if (faceShape.includes('round')) {
    return 'Structured jackets flatter your round face';
  }

  if (faceShape.includes('square')) {
    return 'Minimalist styles complement your square face';
  }

  if (hairStyle) {
    return 'Complements your hair style';
  }

  if (beardStyle) {
    return 'Works with your beard style';
  }

  return 'Complements your face shape';
}

/**
 * Computes raw faceScore from faceShape, hairStyle, and beardStyle.
 */
export function computeFaceScore(faceAnalysis, product) {
  const traits = resolveFaceTraits(faceAnalysis);
  const haystack = buildFaceProductHaystack(product);

  if (!traits.faceShape && !traits.hairStyle && !traits.beardStyle) {
    return { score: 0, factors: [], breakdown: null };
  }

  const shapeResult = scoreFaceShapeTrait(traits.faceShape, haystack);
  const hairResult = scoreHairStyleTrait(traits.hairStyle, haystack);
  const beardResult = scoreBeardStyleTrait(traits.beardStyle, haystack);

  const breakdown = {
    faceShape: shapeResult.score,
    hairStyle: hairResult.score,
    beardStyle: beardResult.score,
  };

  const factors = [
    ...shapeResult.factors,
    ...hairResult.factors.filter((factor) => !shapeResult.factors.includes(factor)),
    ...beardResult.factors.filter(
      (factor) => !shapeResult.factors.includes(factor) && !hairResult.factors.includes(factor),
    ),
  ];

  const score = Math.min(
    FACE_SCORE_RAW_MAX,
    breakdown.faceShape + breakdown.hairStyle + breakdown.beardStyle,
  );

  return {
    score,
    factors,
    breakdown,
  };
}
