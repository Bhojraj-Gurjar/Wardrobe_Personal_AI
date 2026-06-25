import { RECOMMENDATION_SIGNAL_TYPES } from '../../types';
import { computeBehaviorScore } from '../../utils/behavior-score.util';

export class BehaviorBasedRecommendationStrategy {
  static id = RECOMMENDATION_SIGNAL_TYPES.BEHAVIOR_BASED;

  supports(context) {
    return Boolean(
      context.behavior?.interactions?.length
      || context.behavior?.viewedProductIds?.length
      || context.behavior?.recentSearchTerms?.length
      || context.signals?.wishlistProductIds?.length,
    );
  }

  scoreProduct(context, product) {
    if (!this.supports(context)) {
      return { score: 0, factors: [] };
    }

    const result = computeBehaviorScore(product, context.behavior);

    return {
      score: result.score,
      factors: result.factors,
      behaviorScoreBreakdown: result.breakdown,
    };
  }
}
