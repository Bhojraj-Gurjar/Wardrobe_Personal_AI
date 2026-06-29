export function extractOnboardingInputs(profile) {
  const preferences = profile?.preferences || {};

  return {
    gender: profile?.gender ?? null,
    age: profile?.age ?? null,
    height: profile?.height ?? null,
    weight: profile?.weight ?? null,
    country: profile?.country ?? null,
    language: profile?.language ?? null,
    occupation: preferences.occupation ?? null,
    shopping_frequency: preferences.shopping_frequency ?? null,
    budget_preference: preferences.budget_preference ?? null,
    preferred_categories: Array.isArray(preferences.preferred_categories)
      ? preferences.preferred_categories
      : [],
    favorite_colors: Array.isArray(preferences.favorite_colors)
      ? preferences.favorite_colors
      : [],
  };
}

function isFilled(value) {
  if (value === null || value === undefined || value === '') {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
}

export function getMissingOnboardingFields(inputs) {
  return Object.entries(inputs)
    .filter(([, value]) => !isFilled(value))
    .map(([key]) => key);
}

export function buildPreferenceTraitsFromOnboarding(inputs) {
  return {
    occupation: inputs.occupation,
    shopping_frequency: inputs.shopping_frequency,
    budget_preference: inputs.budget_preference,
    preferred_categories: inputs.preferred_categories,
    favorite_colors: inputs.favorite_colors,
  };
}

export function isPlaceholderFashionDna(record) {
  if (!record) {
    return true;
  }

  const preferenceTraits = record.preference_traits || record.preferenceTraits || {};
  const activityTraits = record.activity_traits || record.activityTraits || {};

  if (preferenceTraits.isDefault || activityTraits.isDefault) {
    return true;
  }

  const styleType = String(record.style_type || record.styleType || '').toUpperCase();
  const confidence = Number(
    record.fashion_confidence_score ?? record.fashionConfidenceScore ?? 0,
  );

  return styleType === 'DEVELOPING' && confidence <= 0;
}

export function hasOnboardingFaceSignals(context) {
  const { faceTraits, profile } = context || {};

  return Boolean(
    faceTraits?.face_shape
    || faceTraits?.faceShape
    || faceTraits?.is_face_registered
    || profile?.skin_tone,
  );
}

export function hasOnboardingBodySignals(context) {
  const { bodyTraits, profile } = context || {};

  if (
    bodyTraits?.body_type
    || bodyTraits?.bodyType
    || bodyTraits?.analysis_source === 'body_analysis_record'
  ) {
    return true;
  }

  const height = bodyTraits?.height ?? profile?.height;
  const weight = bodyTraits?.weight ?? profile?.weight;

  return Boolean(height && weight);
}

export function mapAiResponseToPayload(aiResponse, context) {
  const { faceTraits, bodyTraits, onboarding } = context;

  return {
    style_type: aiResponse.styleType,
    color_affinity: aiResponse.colorAffinity || {},
    budget_range: aiResponse.budgetRange,
    brand_affinity: aiResponse.brandAffinity || {},
    fashion_confidence_score: aiResponse.fashionConfidenceScore ?? 0,
    face_traits: faceTraits,
    body_traits: bodyTraits,
    preference_traits: {
      ...buildPreferenceTraitsFromOnboarding(onboarding),
      category_affinity: aiResponse.categoryAffinity || {},
      fashion_personality: aiResponse.fashionPersonality,
    },
    activity_traits: aiResponse.activityTraits || {},
  };
}
