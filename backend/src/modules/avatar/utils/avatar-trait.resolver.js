import {
  normalizeHairColor,
  normalizeSkinTone,
  resolveBaseAvatarUrl,
} from '../constants/avatar-base.constants';

export function extractStylePreferences(fashionDna) {
  if (!fashionDna) {
    return null;
  }

  const preferenceTraits =
    fashionDna.preferenceTraits
    || fashionDna.preference_traits
    || {};

  return {
    styleType: fashionDna.styleType || fashionDna.style_type || null,
    colorAffinity: fashionDna.colorAffinity || fashionDna.color_affinity || null,
    brandAffinity: fashionDna.brandAffinity || fashionDna.brand_affinity || null,
    preferredCategories: preferenceTraits.preferred_categories || [],
    favoriteColors: preferenceTraits.favorite_colors || [],
    categoryAffinity: preferenceTraits.category_affinity || {},
    fashionPersonality: preferenceTraits.fashion_personality || null,
    budgetPreference: preferenceTraits.budget_preference || null,
    shoppingFrequency: preferenceTraits.shopping_frequency || null,
  };
}

function readBodyType(bodyAnalysis, fashionDna, profile) {
  if (bodyAnalysis?.hasAnalysis !== false && bodyAnalysis?.bodyType) {
    return bodyAnalysis.bodyType;
  }

  const dnaBodyTraits = fashionDna?.bodyTraits || fashionDna?.body_traits || {};

  return (
    dnaBodyTraits.bodyType
    || dnaBodyTraits.body_type
    || profile?.body_type
    || profile?.bodyType
    || null
  );
}

function readSkinTone(faceAnalysis, fashionDna, profile) {
  if (faceAnalysis?.hasAnalysis !== false && faceAnalysis?.skinTone) {
    return faceAnalysis.skinTone;
  }

  const dnaFaceTraits = fashionDna?.faceTraits || fashionDna?.face_traits || {};

  return (
    dnaFaceTraits.skinTone
    || dnaFaceTraits.skin_tone
    || profile?.skin_tone
    || profile?.skinTone
    || null
  );
}

function readHairColor(faceAnalysis, fashionDna, profile) {
  if (faceAnalysis?.hasAnalysis !== false && faceAnalysis?.hairColor) {
    return faceAnalysis.hairColor;
  }

  const dnaFaceTraits = fashionDna?.faceTraits || fashionDna?.face_traits || {};

  return (
    dnaFaceTraits.hairColor
    || dnaFaceTraits.hair_color
    || profile?.preferences?.hairColor
    || null
  );
}

export function resolveTraitsFromModules({
  bodyAnalysis = null,
  faceAnalysis = null,
  fashionDna = null,
  profile = null,
} = {}) {
  const bodyType = readBodyType(bodyAnalysis, fashionDna, profile);
  const skinTone = readSkinTone(faceAnalysis, fashionDna, profile);
  const hairColor = readHairColor(faceAnalysis, fashionDna, profile);
  const stylePreferences = extractStylePreferences(fashionDna);

  return {
    bodyType,
    skinTone: normalizeSkinTone(skinTone),
    hairColor: normalizeHairColor(hairColor),
    baseAvatarUrl: resolveBaseAvatarUrl(bodyType),
    stylePreferences,
    traitSources: {
      bodyAnalysis: Boolean(bodyAnalysis?.hasAnalysis && bodyAnalysis?.bodyType),
      faceAnalysis: Boolean(
        faceAnalysis?.hasAnalysis
        && (faceAnalysis?.skinTone || faceAnalysis?.hairColor),
      ),
      fashionDna: Boolean(fashionDna?.id || fashionDna?.styleType || fashionDna?.style_type),
      profile: Boolean(profile),
    },
  };
}
