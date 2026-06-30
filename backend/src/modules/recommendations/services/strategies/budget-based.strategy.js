import { RECOMMENDATION_SIGNAL_TYPES } from '../../types';
import { computeBudgetScore } from '../../utils/budget-score.util';

export class BudgetBasedRecommendationStrategy {
  static id = RECOMMENDATION_SIGNAL_TYPES.BUDGET_BASED;

  supports(context) {
    return Boolean(context.budgetProfile?.max || context.budgetProfile?.min);
  }

  scoreProduct(context, product) {
    if (!this.supports(context)) {
      return { score: 0, factors: [] };
    }

    const result = computeBudgetScore(product, context.budgetProfile);

    return {
      score: result.score,
      factors: result.factors,
      inBudget: result.inBudget,
      budgetScoreBreakdown: result.breakdown,
    };
  }
}
