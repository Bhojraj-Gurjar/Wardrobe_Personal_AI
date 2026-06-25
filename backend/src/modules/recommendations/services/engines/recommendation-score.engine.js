import {
  RECOMMENDATION_FACTORS,
  RECOMMENDATION_SIGNAL_TYPES,
} from '../../types';
import {
  buildScoreExplanations,
  resolvePrimaryExplanation,
} from '../../utils/recommendation-reason.util';
import { computeTrendScore, TREND_RAW_MAX } from '../../utils/trending-score.util';

const CORE_SCORE_KEYS = [
  'faceScore',
  'bodyScore',
  'skinToneScore',
  'budgetScore',
  'behaviorScore',
  'similarUserScore',
  'trendScore',
];

/** Per-component caps — sum to 100. */
export const SCORE_COMPONENT_CAPS = {
  faceScore: 14,
  bodyScore: 14,
  skinToneScore: 14,
  budgetScore: 14,
  behaviorScore: 16,
  similarUserScore: 14,
  trendScore: 14,
};

const STRATEGY_COMPONENT_CONFIG = {
  [RECOMMENDATION_SIGNAL_TYPES.FACE_BASED]: {
    key: 'faceScore',
    rawMax: 30,
  },
  [RECOMMENDATION_SIGNAL_TYPES.BODY_BASED]: {
    key: 'bodyScore',
    rawMax: 36,
  },
  [RECOMMENDATION_SIGNAL_TYPES.SKIN_TONE_BASED]: {
    key: 'skinToneScore',
    rawMax: 34,
  },
  [RECOMMENDATION_SIGNAL_TYPES.BUDGET_BASED]: {
    key: 'budgetScore',
    rawMax: 22,
  },
  [RECOMMENDATION_SIGNAL_TYPES.BEHAVIOR_BASED]: {
    key: 'behaviorScore',
    rawMax: 68,
  },
  [RECOMMENDATION_SIGNAL_TYPES.SIMILAR_USER_BASED]: {
    key: 'similarUserScore',
    rawMax: 40,
  },
};

const TREND_RAW_MAX_VALUE = TREND_RAW_MAX;

export function createEmptyScoreBreakdown() {
  return {
    faceScore: 0,
    bodyScore: 0,
    skinToneScore: 0,
    budgetScore: 0,
    behaviorScore: 0,
    similarUserScore: 0,
    trendScore: 0,
    personalizationScore: 0,
  };
}

export function normalizeComponentScore(raw, rawMax, cap) {
  const value = Number(raw) || 0;

  if (value <= 0 || !rawMax || !cap) {
    return 0;
  }

  const normalized = (value / rawMax) * cap;
  return Math.min(cap, Math.round(normalized * 100) / 100);
}

export function clampFinalScore(score) {
  return Math.max(0, Math.min(100, Math.round(Number(score) * 100) / 100));
}

export function computeTrendRawScore(context, product) {
  return computeTrendScore(product, context.trending || {}).score;
}

export function sumScoreBreakdown(breakdown) {
  return CORE_SCORE_KEYS.reduce(
    (sum, key) => sum + (Number(breakdown[key]) || 0),
    0,
  );
}

export class RecommendationScoreEngine {
  /**
   * finalScore =
   *   faceScore + bodyScore + skinToneScore + budgetScore +
   *   behaviorScore + similarUserScore + trendScore
   * Clamped to 0–100.
   */
  scoreProduct(context, product, strategyRegistry) {
    const strategyResults = strategyRegistry.scoreProduct(context, product);
    const scoreBreakdown = createEmptyScoreBreakdown();
    const matchedFactors = [];

    strategyResults.forEach((result) => {
      const config = STRATEGY_COMPONENT_CONFIG[result.strategyId];

      if (!config) {
        return;
      }

      const raw = Number(result.score) || 0;

      if (raw <= 0) {
        return;
      }

      scoreBreakdown[config.key] = normalizeComponentScore(
        raw,
        config.rawMax,
        SCORE_COMPONENT_CAPS[config.key],
      );

      (result.factors || []).forEach((factor) => {
        if (!matchedFactors.includes(factor)) {
          matchedFactors.push(factor);
        }
      });
    });

    const trendRaw = computeTrendRawScore(context, product);

    if (trendRaw > 0) {
      scoreBreakdown.trendScore = normalizeComponentScore(
        trendRaw,
        TREND_RAW_MAX_VALUE,
        SCORE_COMPONENT_CAPS.trendScore,
      );

      if (!matchedFactors.includes(RECOMMENDATION_FACTORS.TRENDING)) {
        matchedFactors.push(RECOMMENDATION_FACTORS.TRENDING);
      }
    }

    scoreBreakdown.personalizationScore = (
      scoreBreakdown.faceScore
      + scoreBreakdown.bodyScore
      + scoreBreakdown.skinToneScore
      + scoreBreakdown.budgetScore
    );

    const finalScore = clampFinalScore(sumScoreBreakdown(scoreBreakdown));
    const explanations = buildScoreExplanations(scoreBreakdown, context);

    return {
      score: finalScore,
      scoreBreakdown,
      matched_factors: matchedFactors,
      explanations,
      reason: resolvePrimaryExplanation(explanations),
    };
  }
}
