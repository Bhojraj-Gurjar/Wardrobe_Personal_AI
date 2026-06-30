import { RECOMMENDATION_SIGNAL_TYPES } from '../../types';
import { computeBodyScore, resolveBodyTraits } from '../../utils/body-score.util';

export class BodyBasedRecommendationStrategy {
  static id = RECOMMENDATION_SIGNAL_TYPES.BODY_BASED;

  supports(context) {
    const traits = resolveBodyTraits(
      context.bodyAnalysis || {},
      context.signals?.profile,
    );

    return Boolean(
      traits.bodyType
      || traits.bodyShape
      || traits.heightCm
      || traits.measurements,
    );
  }

  scoreProduct(context, product) {
    if (!this.supports(context)) {
      return { score: 0, factors: [] };
    }

    const result = computeBodyScore(
      context.bodyAnalysis,
      product,
      context.signals?.profile,
    );

    return {
      score: result.score,
      factors: result.factors,
      bodyScoreBreakdown: result.breakdown,
    };
  }
}
