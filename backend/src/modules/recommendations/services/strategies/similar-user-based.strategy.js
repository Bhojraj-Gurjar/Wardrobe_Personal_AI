import { RECOMMENDATION_SIGNAL_TYPES } from '../../types';
import { computeSimilarUserScore } from '../../utils/similar-user-score.util';

export class SimilarUserBasedRecommendationStrategy {
  static id = RECOMMENDATION_SIGNAL_TYPES.SIMILAR_USER_BASED;

  supports(context) {
    return Boolean(context.similarUsers?.userIds?.length);
  }

  scoreProduct(context, product) {
    if (!this.supports(context)) {
      return { score: 0, factors: [] };
    }

    const result = computeSimilarUserScore(
      product,
      context.similarUsers,
      context.budgetProfile,
    );

    return {
      score: result.score,
      factors: result.factors,
      similarUserScoreBreakdown: result.breakdown,
    };
  }
}
