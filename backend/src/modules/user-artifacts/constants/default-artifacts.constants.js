export const DEFAULT_FACE_ANALYSIS = {
  face_shape: 'Oval',
  skin_tone: 'Medium',
  hair_style: 'Soft Waves',
  hair_length: 'Medium',
  hair_color: 'Black',
  beard_type: 'Clean Shaven',
  raw_ai_response: {
    isDefault: true,
    faceShape: 'Oval',
    skinTone: 'Medium',
    hairStyle: 'Soft Waves',
    hairLength: 'Medium',
    hairColor: 'Black',
    beardType: 'Clean Shaven',
    faceShapeConfidence: 94,
    skinToneConfidence: 94,
    hairStyleConfidence: 94,
    hairLengthConfidence: 94,
    hairColorConfidence: 94,
    beardTypeConfidence: 94,
    recommendations: [
      'V-neck tops',
      'Structured jackets',
      'Layered accessories',
      'Balanced collar styles',
    ],
  },
};

const INCH_TO_CM = 2.54;

export const DEFAULT_BODY_MEASUREMENTS_INCHES = {
  height: 70,
  shoulder: 18,
  chest: 40,
  waist: 32,
  hip: 38,
  armLength: 24,
  legLength: 32,
};

function inchToCm(inches) {
  return Math.round(inches * INCH_TO_CM * 10) / 10;
}

export const DEFAULT_BODY_ANALYSIS = {
  body_type: 'Athletic',
  body_shape: 'Inverted Triangle',
  height: inchToCm(DEFAULT_BODY_MEASUREMENTS_INCHES.height),
  shoulder_width: inchToCm(DEFAULT_BODY_MEASUREMENTS_INCHES.shoulder),
  chest: inchToCm(DEFAULT_BODY_MEASUREMENTS_INCHES.chest),
  waist: inchToCm(DEFAULT_BODY_MEASUREMENTS_INCHES.waist),
  hip: inchToCm(DEFAULT_BODY_MEASUREMENTS_INCHES.hip),
  arm_length: inchToCm(DEFAULT_BODY_MEASUREMENTS_INCHES.armLength),
  leg_length: inchToCm(DEFAULT_BODY_MEASUREMENTS_INCHES.legLength),
  fit_profile: {
    sections: [
      { id: 'tops', fit: 'Slim fit tops' },
      { id: 'bottoms', fit: 'Straight trousers' },
      { id: 'outerwear', fit: 'Tailored jackets' },
      { id: 'footwear', fit: 'Minimal bulky footwear' },
    ],
  },
  raw_ai_response: {
    isDefault: true,
    bodyType: 'Athletic',
    bodyShape: 'Inverted Triangle',
    bodyTypeConfidence: 85,
    overallConfidence: 85,
    profileChips: [
      { label: 'Lean', sublabel: 'Build' },
      { label: 'Upright', sublabel: 'Posture' },
      { label: 'Broad', sublabel: 'Frame' },
    ],
    measurements: {
      height: { value: inchToCm(DEFAULT_BODY_MEASUREMENTS_INCHES.height), normalized: 0.82 },
      shoulderWidth: { value: inchToCm(DEFAULT_BODY_MEASUREMENTS_INCHES.shoulder), normalized: 0.85 },
      chest: { value: inchToCm(DEFAULT_BODY_MEASUREMENTS_INCHES.chest), normalized: 0.84 },
      waist: { value: inchToCm(DEFAULT_BODY_MEASUREMENTS_INCHES.waist), normalized: 0.72 },
      hip: { value: inchToCm(DEFAULT_BODY_MEASUREMENTS_INCHES.hip), normalized: 0.78 },
      armLength: { value: inchToCm(DEFAULT_BODY_MEASUREMENTS_INCHES.armLength), normalized: 0.8 },
      legLength: { value: inchToCm(DEFAULT_BODY_MEASUREMENTS_INCHES.legLength), normalized: 0.83 },
    },
    recommendations: [
      'Slim fit tops',
      'Straight trousers',
      'Tailored jackets',
      'Minimal bulky footwear',
    ],
  },
};

export const DEFAULT_FASHION_DNA = {
  style_type: 'SMART_CASUAL',
  color_affinity: {
    black: 0.92,
    white: 0.88,
    navy: 0.85,
  },
  budget_range: 'MID_RANGE',
  brand_affinity: {},
  fashion_confidence_score: 85,
  face_traits: {
    face_shape: 'Oval',
    skin_tone: 'Medium',
    hair_style: 'Soft Waves',
    hair_color: 'Black',
  },
  body_traits: {
    body_type: 'Athletic',
    build: 'Lean',
    frame: 'Broad',
    posture: 'Upright',
  },
  preference_traits: {
    fashion_personality: 'Smart Casual',
    favorite_colors: ['Black', 'White', 'Navy'],
    preferred_fits: ['Slim Fit'],
    occasions: ['Casual', 'Office'],
    preferred_categories: ['CASUAL', 'FORMAL'],
  },
  activity_traits: {
    recommendations: [
      'Minimal layering',
      'Neutral palettes',
      'Clean silhouettes',
    ],
    topColors: ['Black', 'White', 'Navy'],
  },
};

export const DEFAULT_AVATAR_METADATA = {
  isDefault: true,
  skinTone: 'Medium',
  bodyType: 'Athletic',
  hairAnalysis: {
    hairColor: 'Black',
    hairStyle: 'Soft Waves',
  },
  outfit: {
    top: { name: 'Black T-shirt', color: '#111111', category: 'top' },
    pants: { name: 'Blue jeans', color: '#1e3a8a', category: 'pants' },
    shoes: { name: 'White sneakers', color: '#f5f5f5', category: 'shoes' },
  },
};

export function buildDefaultAvatarSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 480" role="img" aria-label="Digital avatar preview">
  <rect width="240" height="480" fill="#111827"/>
  <circle cx="120" cy="72" r="34" fill="#C68642"/>
  <rect x="88" y="108" width="64" height="18" rx="8" fill="#1f2937"/>
  <rect x="76" y="126" width="88" height="120" rx="18" fill="#111111"/>
  <rect x="92" y="246" width="56" height="130" rx="14" fill="#1e3a8a"/>
  <rect x="82" y="378" width="76" height="28" rx="10" fill="#f5f5f5"/>
</svg>`;
}
