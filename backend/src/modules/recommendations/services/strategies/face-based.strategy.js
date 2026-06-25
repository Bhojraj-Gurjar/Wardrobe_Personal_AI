import { RECOMMENDATION_SIGNAL_TYPES } from '../../types';
import { computeFaceScore, resolveFaceTraits } from '../../utils/face-score.util';

export class FaceBasedRecommendationStrategy {
  static id = RECOMMENDATION_SIGNAL_TYPES.FACE_BASED;

  supports(context) {
    const traits = resolveFaceTraits(context.faceAnalysis || {});

    return Boolean(traits.faceShape || traits.hairStyle || traits.beardStyle);
  }

  scoreProduct(context, product) {
    if (!this.supports(context)) {
      return { score: 0, factors: [] };
    }

    const result = computeFaceScore(context.faceAnalysis, product);

    return {
      score: result.score,
      factors: result.factors,
      faceScoreBreakdown: result.breakdown,
    };
  }
}
