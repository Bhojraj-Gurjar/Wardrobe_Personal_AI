import { RECOMMENDATION_FACTORS } from '../types';

export const BUDGET_SCORE_RAW_MAX = 22;

const IN_BUDGET_BASE = 14;
const IN_BUDGET_BONUS_MAX = 8;
const OUT_OF_BUDGET_MAX = 4;

export function resolveOnboardingBudget(profile = {}, fashionDna = null) {
  const preferences = profile?.preferences || {};
  const explicitMin = Number(preferences.minBudget ?? preferences.min_budget);
  const explicitMax = Number(preferences.maxBudget ?? preferences.max_budget);

  if (Number.isFinite(explicitMin) && Number.isFinite(explicitMax) && explicitMax > explicitMin) {
    return {
      min: explicitMin,
      max: explicitMax,
      target: (explicitMin + explicitMax) / 2,
      budgetRange: preferences.budget_preference || null,
      source: 'onboarding',
    };
  }

  const budgetRange = fashionDna?.budget_range || preferences.budget_preference;
  const normalized = String(budgetRange || '').toLowerCase();

  const presets = {
    economy: { min: 0, max: 75, target: 45 },
    low: { min: 0, max: 75, target: 45 },
    budget: { min: 0, max: 75, target: 45 },
    mid_range: { min: 50, max: 200, target: 120 },
    mid: { min: 50, max: 200, target: 120 },
    moderate: { min: 50, max: 200, target: 120 },
    premium: { min: 150, max: 500, target: 280 },
    high: { min: 150, max: 500, target: 280 },
    luxury: { min: 300, max: 2000, target: 600 },
  };

  for (const [key, range] of Object.entries(presets)) {
    if (normalized.includes(key)) {
      return { ...range, budgetRange, source: 'preference' };
    }
  }

  return null;
}

export function isProductInBudget(product, budgetProfile = {}) {
  const price = Number(product?.price) || 0;
  const min = Number(budgetProfile.min);
  const max = Number(budgetProfile.max);

  if (!Number.isFinite(max)) {
    return true;
  }

  const lower = Number.isFinite(min) ? min : 0;
  return price >= lower && price <= max;
}

export function resolveBudgetScoreReason(budgetProfile = {}, inBudget = true) {
  if (!budgetProfile?.max) {
    return 'Fits your budget';
  }

  if (inBudget) {
    return `Within your $${budgetProfile.min ?? 0}–$${budgetProfile.max} budget`;
  }

  return `Outside your $${budgetProfile.min ?? 0}–$${budgetProfile.max} budget`;
}

export function computeBudgetScore(product, budgetProfile = {}) {
  if (!budgetProfile || (!budgetProfile.min && !budgetProfile.max)) {
    return { score: 0, factors: [], inBudget: true, breakdown: null };
  }

  const price = Number(product?.price) || 0;
  const min = Number(budgetProfile.min) ?? 0;
  const max = Number(budgetProfile.max);
  const target = Number(budgetProfile.target) || (min + max) / 2;
  const inBudget = isProductInBudget(product, budgetProfile);

  if (inBudget) {
    const range = Math.max(max - min, 1);
    const closeness = 1 - Math.min(1, Math.abs(price - target) / range);
    const score = Math.min(
      BUDGET_SCORE_RAW_MAX,
      IN_BUDGET_BASE + Math.round(closeness * IN_BUDGET_BONUS_MAX),
    );

    return {
      score,
      factors: [RECOMMENDATION_FACTORS.BUDGET],
      inBudget: true,
      breakdown: { price, min, max, target, closeness },
    };
  }

  const distance = price > max ? price - max : min - price;
  const penalty = Math.min(IN_BUDGET_BASE, distance / Math.max(max * 0.15, 10));
  const score = Math.max(0, Math.min(OUT_OF_BUDGET_MAX, OUT_OF_BUDGET_MAX - penalty));

  return {
    score,
    factors: score > 0 ? [] : [],
    inBudget: false,
    breakdown: { price, min, max, distance },
  };
}
