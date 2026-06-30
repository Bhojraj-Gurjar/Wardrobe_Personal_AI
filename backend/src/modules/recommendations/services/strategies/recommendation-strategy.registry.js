import { FaceBasedRecommendationStrategy } from './face-based.strategy';
import { BodyBasedRecommendationStrategy } from './body-based.strategy';
import { SkinToneBasedRecommendationStrategy } from './skin-tone-based.strategy';
import { BudgetBasedRecommendationStrategy } from './budget-based.strategy';
import { BehaviorBasedRecommendationStrategy } from './behavior-based.strategy';
import { SimilarUserBasedRecommendationStrategy } from './similar-user-based.strategy';

const STRATEGY_CLASSES = [
  FaceBasedRecommendationStrategy,
  BodyBasedRecommendationStrategy,
  SkinToneBasedRecommendationStrategy,
  BudgetBasedRecommendationStrategy,
  BehaviorBasedRecommendationStrategy,
  SimilarUserBasedRecommendationStrategy,
];

export class RecommendationStrategyRegistry {
  constructor() {
    this.strategies = STRATEGY_CLASSES.map((StrategyClass) => new StrategyClass());
  }

  getAll() {
    return this.strategies;
  }

  getActive(context) {
    return this.strategies.filter((strategy) => strategy.supports(context));
  }

  scoreProduct(context, product, options = {}) {
    const active = options.strategyIds
      ? this.strategies.filter((strategy) => options.strategyIds.includes(strategy.constructor.id))
      : this.getActive(context);

    const results = active.map((strategy) => {
      const StrategyClass = strategy.constructor;
      const result = strategy.scoreProduct(context, product);
      return {
        ...result,
        strategyId: StrategyClass.id,
      };
    });

    return results;
  }
}

export {
  FaceBasedRecommendationStrategy,
  BodyBasedRecommendationStrategy,
  SkinToneBasedRecommendationStrategy,
  BudgetBasedRecommendationStrategy,
  BehaviorBasedRecommendationStrategy,
  SimilarUserBasedRecommendationStrategy,
};
