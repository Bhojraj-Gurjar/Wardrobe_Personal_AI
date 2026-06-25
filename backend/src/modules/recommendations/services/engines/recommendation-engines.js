import { RECOMMENDATION_TYPES } from '../../types';
import { scoreEventMatch, scoreSeasonalMatch } from '../../utils/seasonal-context.util';
import { RecommendationScoreEngine } from './recommendation-score.engine';

const sharedScoreEngine = new RecommendationScoreEngine();

export class BaseRecommendationEngine {
  constructor(type, options = {}) {
    this.type = type;
    this.scoreEngine = options.scoreEngine || sharedScoreEngine;
  }

  scoreProduct(context, product, strategyRegistry) {
    const base = this.scoreEngine.scoreProduct(context, product, strategyRegistry);
    return this.applyTypeModifier(context, product, base);
  }

  applyTypeModifier(context, product, scored) {
    return scored;
  }
}

export class DailyRecommendationEngine extends BaseRecommendationEngine {
  constructor(scoreEngine = sharedScoreEngine) {
    super(RECOMMENDATION_TYPES.DAILY, { scoreEngine });
  }
}

export class SeasonalRecommendationEngine extends BaseRecommendationEngine {
  constructor(scoreEngine = sharedScoreEngine) {
    super(RECOMMENDATION_TYPES.SEASONAL, { scoreEngine });
  }

  applyTypeModifier(context, product, scored) {
    const seasonal = scoreSeasonalMatch(product, context.seasonalContext);

    if (!seasonal.matched) {
      return {
        ...scored,
        score: Math.max(0, scored.score - 12),
      };
    }

    const bonus = Math.min(18, seasonal.score / 2);
    return {
      ...scored,
      score: Math.min(100, scored.score + bonus),
      matched_factors: [...new Set([...(scored.matched_factors || []), 'seasonal'])],
    };
  }
}

export class EventRecommendationEngine extends BaseRecommendationEngine {
  constructor(scoreEngine = sharedScoreEngine) {
    super(RECOMMENDATION_TYPES.EVENT, { scoreEngine });
  }

  applyTypeModifier(context, product, scored) {
    const event = scoreEventMatch(product, context.eventType || 'casual');

    if (!event.matched) {
      return {
        ...scored,
        score: Math.max(0, scored.score - 15),
      };
    }

    return {
      ...scored,
      score: Math.min(100, scored.score + Math.min(20, event.score / 2)),
      matched_factors: [...new Set([...(scored.matched_factors || []), 'event'])],
    };
  }
}

export class TrendingRecommendationEngine extends BaseRecommendationEngine {
  constructor(scoreEngine = sharedScoreEngine) {
    super(RECOMMENDATION_TYPES.TRENDING, { scoreEngine });
  }

  applyTypeModifier(context, product, scored) {
    const trendComponent = scored.scoreBreakdown?.trendScore || 0;
    const boosted = trendComponent * 2.2 + (scored.score - trendComponent) * 0.35;

    return {
      ...scored,
      score: Math.min(100, Math.round(boosted * 100) / 100),
    };
  }
}
