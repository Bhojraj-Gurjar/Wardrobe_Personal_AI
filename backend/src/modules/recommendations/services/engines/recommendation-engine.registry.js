import { RECOMMENDATION_TYPES } from '../../types';
import {
  DailyRecommendationEngine,
  SeasonalRecommendationEngine,
  EventRecommendationEngine,
  TrendingRecommendationEngine,
} from './recommendation-engines';

export class RecommendationEngineRegistry {
  constructor() {
    this.engines = new Map([
      [RECOMMENDATION_TYPES.DAILY, new DailyRecommendationEngine()],
      [RECOMMENDATION_TYPES.SEASONAL, new SeasonalRecommendationEngine()],
      [RECOMMENDATION_TYPES.EVENT, new EventRecommendationEngine()],
      [RECOMMENDATION_TYPES.TRENDING, new TrendingRecommendationEngine()],
    ]);
  }

  resolve(type = RECOMMENDATION_TYPES.DAILY) {
    return this.engines.get(type) || this.engines.get(RECOMMENDATION_TYPES.DAILY);
  }

  listTypes() {
    return [...this.engines.keys()];
  }
}

export {
  DailyRecommendationEngine,
  SeasonalRecommendationEngine,
  EventRecommendationEngine,
  TrendingRecommendationEngine,
};
