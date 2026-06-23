import { Injectable } from '@nestjs/common';
import {
  BMI_CATEGORY,
  BODY_TYPE_LIFESTYLE_HINT,
  BODY_TYPE_STYLE_FIT,
  SKIN_TONE_COLOR_MAP,
} from '../constants/body-analysis.constants';

function computeBmi(heightCm, weightKg) {
  if (!heightCm || !weightKg || heightCm <= 0) {
    return null;
  }

  const heightMeters = heightCm / 100;
  return Number((weightKg / (heightMeters * heightMeters)).toFixed(1));
}

function classifyBmi(bmi) {
  if (bmi === null || bmi === undefined) {
    return null;
  }

  if (bmi < 18.5) {
    return BMI_CATEGORY.UNDERWEIGHT;
  }

  if (bmi < 25) {
    return BMI_CATEGORY.NORMAL;
  }

  if (bmi < 30) {
    return BMI_CATEGORY.OVERWEIGHT;
  }

  return BMI_CATEGORY.OBESE;
}

export @Injectable()
class BodyProfileInsightsService {
  analyze(profile) {
    const bmi = computeBmi(profile?.height, profile?.weight);
    const bodyType = profile?.body_type || null;
    const skinTone = profile?.skin_tone || null;

    return {
      gender: profile?.gender ?? null,
      age: profile?.age ?? null,
      height: profile?.height ?? null,
      weight: profile?.weight ?? null,
      country: profile?.country ?? null,
      language: profile?.language ?? null,
      body_type: bodyType,
      skin_tone: skinTone,
      bmi,
      bmi_category: classifyBmi(bmi),
      style_fit_hint: bodyType ? BODY_TYPE_STYLE_FIT[bodyType] || null : null,
      lifestyle_hint: bodyType ? BODY_TYPE_LIFESTYLE_HINT[bodyType] || null : null,
      complementary_colors: skinTone ? SKIN_TONE_COLOR_MAP[skinTone] || [] : [],
      analysis_source: 'body_profile_insights',
      analyzed_at: new Date().toISOString(),
    };
  }
}
