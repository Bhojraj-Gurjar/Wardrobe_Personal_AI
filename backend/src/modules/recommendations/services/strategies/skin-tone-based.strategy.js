import { RECOMMENDATION_SIGNAL_TYPES } from '../../types';
import {
  computeSkinToneScore,
  resolveSkinTone,
} from '../../utils/skin-tone-score.util';

export class SkinToneBasedRecommendationStrategy {
  static id = RECOMMENDATION_SIGNAL_TYPES.SKIN_TONE_BASED;

  supports(context) {
    return Boolean(resolveSkinTone(context.faceAnalysis || {}, context.signals?.profile));
  }

  scoreProduct(context, product) {
    if (!this.supports(context)) {
      return { score: 0, factors: [] };
    }

    const result = computeSkinToneScore(
      context.faceAnalysis,
      product,
      context.signals?.profile,
    );

    return {
      score: result.score,
      factors: result.factors,
      skinToneScoreBreakdown: result.breakdown,
    };
  }
}
