import {
  normalizeHairColor,
  normalizeSkinTone,
} from '../constants/avatar-base.constants';

function formatLabel(value) {
  if (!value) return null;
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function mapBodyTypeToRpm(bodyType) {
  const normalized = String(bodyType || '').trim().toLowerCase().replace(/_/g, '-');

  const map = {
    slim: 'slim',
    athletic: 'athletic',
    average: 'average',
    curvy: 'heavyset',
    'plus-size': 'heavyset',
    muscular: 'athletic',
  };

  return map[normalized] || 'average';
}

function mapSkinToneToHex(skinTone) {
  const normalized = normalizeSkinTone(skinTone);
  const palette = {
    FAIR: '#F5D0C5',
    LIGHT: '#E8B89A',
    MEDIUM: '#C68658',
    OLIVE: '#A67C52',
    TAN: '#8D5524',
    BROWN: '#6B4423',
    DARK: '#5C3D2E',
  };

  return palette[normalized] || palette.MEDIUM;
}

function mapHairColorToHex(hairColor) {
  const normalized = normalizeHairColor(hairColor);
  const palette = {
    BLACK: '#1A1412',
    'DARK-BROWN': '#3D2B1F',
    BROWN: '#6B4423',
    AUBURN: '#8B3A2A',
    BLONDE: '#D4A76A',
    PLATINUM: '#E8DCC8',
    GRAY: '#9CA3AF',
    RED: '#B45309',
  };

  return palette[normalized] || palette.BLACK;
}

function resolveHeightScale(bodyAnalysis, profile) {
  const heightCm =
    bodyAnalysis?.measurements?.height?.value
    ?? bodyAnalysis?.measurements?.height
    ?? bodyAnalysis?.height
    ?? profile?.height;

  const parsed = Number(heightCm);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 1;
  }

  const baseline = 175;
  return Math.min(1.12, Math.max(0.88, parsed / baseline));
}

function resolveStyleArchetype(stylePreferences = {}) {
  const styleType = String(stylePreferences.styleType || '').toLowerCase();
  const personality = String(stylePreferences.fashionPersonality || '').toLowerCase();
  const budget = String(stylePreferences.budgetPreference || '').toLowerCase();

  if (styleType.includes('formal') || personality.includes('formal')) {
    return 'formal';
  }

  if (styleType.includes('sport') || personality.includes('athleisure')) {
    return 'athleisure';
  }

  if (budget.includes('luxury') || budget.includes('premium')) {
    return 'premium-casual';
  }

  return 'smart-casual';
}

function buildDefaultOutfitBlueprint(archetype) {
  const blueprints = {
    formal: {
      label: 'Formal Presence',
      slots: ['shirt', 'jacket', 'pants', 'shoes'],
      keywords: ['blazer', 'formal', 'trouser', 'loafer', 'oxford'],
    },
    athleisure: {
      label: 'Active Comfort',
      slots: ['tshirt', 'pants', 'shoes'],
      keywords: ['sneaker', 'jogger', 'tee', 'track', 'sport'],
    },
    'premium-casual': {
      label: 'Elevated Casual',
      slots: ['shirt', 'jacket', 'pants', 'shoes'],
      keywords: ['premium', 'linen', 'chino', 'loafer', 'jacket'],
    },
    'smart-casual': {
      label: 'Smart Casual',
      slots: ['tshirt', 'pants', 'shoes'],
      keywords: ['white', 'navy', 'chino', 'sneaker', 'casual'],
    },
  };

  return blueprints[archetype] || blueprints['smart-casual'];
}

export function buildAvatarGenerationProfile({
  bodyAnalysis = null,
  faceAnalysis = null,
  fashionDna = null,
  profile = null,
  traits = null,
} = {}) {
  const faceShape = faceAnalysis?.faceShape || faceAnalysis?.face_shape || null;
  const hairStyle = faceAnalysis?.hairStyle || faceAnalysis?.hair_style || null;
  const beardStyle = faceAnalysis?.beardStyle || faceAnalysis?.beard_style || null;
  const skinTone = traits?.skinTone || faceAnalysis?.skinTone || null;
  const hairColor = traits?.hairColor || faceAnalysis?.hairColor || null;
  const bodyType = traits?.bodyType || bodyAnalysis?.bodyType || profile?.body_type || null;
  const stylePreferences = traits?.stylePreferences || null;
  const archetype = resolveStyleArchetype(stylePreferences);

  return {
    skinTone: normalizeSkinTone(skinTone),
    skinToneHex: mapSkinToneToHex(skinTone),
    hairStyle: formatLabel(hairStyle),
    hairColor: normalizeHairColor(hairColor),
    hairColorHex: mapHairColorToHex(hairColor),
    faceShape: formatLabel(faceShape),
    bodyType: formatLabel(bodyType),
    rpmBodyType: mapBodyTypeToRpm(bodyType),
    beardStyle: formatLabel(beardStyle),
    genderPresentation: formatLabel(profile?.gender),
    ageRange: profile?.age ? `${profile.age}` : null,
    heightScale: resolveHeightScale(bodyAnalysis, profile),
    styleArchetype: archetype,
    defaultOutfitBlueprint: buildDefaultOutfitBlueprint(archetype),
    fashionPersonality:
      stylePreferences?.fashionPersonality
      || fashionDna?.fashionPersonality
      || null,
    favoriteColors: stylePreferences?.favoriteColors || [],
    favoriteBrands: stylePreferences?.brandAffinity
      ? Object.keys(stylePreferences.brandAffinity).slice(0, 5)
      : [],
    budgetType: formatLabel(stylePreferences?.budgetPreference),
    lifestyle: formatLabel(stylePreferences?.occupation || profile?.preferences?.occupation),
    onboardingFaceImageUrl: profile?.faceImageUrl || profile?.face_image_url || null,
    traitSources: traits?.traitSources || null,
  };
}
