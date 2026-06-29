import { isDefaultFaceAnalysisRecord } from '../../face-analysis/utils/face-analysis.mapper';
import { isDefaultBodyAnalysisRecord, hasRealBodyAnalysis } from '../../body-analysis/utils/body-analysis.mapper';
import { isPlaceholderFashionDna } from '../../fashion-dna/services/fashion-dna.generator';

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
  if (!fashionDna || isPlaceholderFashionDna(fashionDna)) {
    return false;
  }

  const brandAffinity = fashionDna.brand_affinity || fashionDna.brandAffinity;
  const colorAffinity = fashionDna.color_affinity || fashionDna.colorAffinity;
  const styleVector = fashionDna.style_vector || fashionDna.styleVector;
  const budgetRange = fashionDna.budget_range || fashionDna.budgetRange;

  return Boolean(
    (brandAffinity && Object.keys(brandAffinity).length)
    || (colorAffinity && Object.keys(colorAffinity).length)
    || (Array.isArray(styleVector) && styleVector.length)
    || (budgetRange && budgetRange !== 'UNKNOWN'),
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
  closetItems = [],
  orders = [],
} = {}) {
  if (
    hasUsableFaceAnalysis(faceAnalysis)
    || hasUsableBodyAnalysis(bodyAnalysis)
    || hasUsableFashionDna(fashionDna)
    || hasOnboardingPreferences(profile)
  ) {
    return true;
  }

  return Boolean(
    productViews.length
    || interactions.length
    || wishlistItems.length
    || closetItems.length
    || orders.length,
  );
}
