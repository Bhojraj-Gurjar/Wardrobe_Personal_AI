import { isDefaultFaceAnalysisRecord } from '../../face-analysis/utils/face-analysis.mapper';
import { isDefaultBodyAnalysisRecord, hasRealBodyAnalysis } from '../../body-analysis/utils/body-analysis.mapper';

export function hasUsableFaceAnalysis(faceAnalysis) {
  if (!faceAnalysis || isDefaultFaceAnalysisRecord(faceAnalysis)) {
    return false;
  }

  return Boolean(
    faceAnalysis.face_shape
    || faceAnalysis.faceShape
    || faceAnalysis.skin_tone
    || faceAnalysis.skinTone,
  );
}

export function hasUsableBodyAnalysis(bodyAnalysis) {
  if (!bodyAnalysis || isDefaultBodyAnalysisRecord(bodyAnalysis)) {
    return false;
  }

  return hasRealBodyAnalysis(bodyAnalysis);
}

export function hasUsableFashionDna(fashionDna) {
  if (!fashionDna) {
    return false;
  }

  return Boolean(
    fashionDna.brand_affinity
    || fashionDna.color_affinity
    || fashionDna.style_vector
    || fashionDna.budget_range,
  );
}

export function hasOnboardingPreferences(profile) {
  const preferences = profile?.preferences;
  if (!preferences || typeof preferences !== 'object') {
    return false;
  }

  return Boolean(
    preferences.budget_preference
    || preferences.minBudget
    || preferences.maxBudget
    || preferences.preferred_categories?.length,
  );
}

export function canPersonalizeRecommendations({
  faceAnalysis,
  bodyAnalysis,
  fashionDna,
  profile,
  productViews = [],
  interactions = [],
  wishlistItems = [],
} = {}) {
  if (
    hasUsableFaceAnalysis(faceAnalysis)
    || hasUsableBodyAnalysis(bodyAnalysis)
    || hasUsableFashionDna(fashionDna)
    || hasOnboardingPreferences(profile)
  ) {
    return true;
  }

  return Boolean(productViews.length || interactions.length || wishlistItems.length);
}
