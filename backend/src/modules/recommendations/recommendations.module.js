import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RecommendationsController } from './controllers/recommendations.controller';
import { RecommendationsService } from './services/recommendations.service';
import { SmartRecommendationService } from './services/smart-recommendation.service';
import { ProductInteractionService } from './services/product-interaction.service';
import { RecommendationsRepository } from './repositories/recommendations.repository';
import { EmbeddingProviderFactory } from './providers/embedding.provider';
import { RecommendationStrategyRegistry } from './services/strategies/recommendation-strategy.registry';
import { RecommendationEngineRegistry } from './services/engines/recommendation-engine.registry';

export @Module({
  imports: [AuthModule],
  controllers: [RecommendationsController],
  providers: [
    RecommendationsService,
    SmartRecommendationService,
    ProductInteractionService,
    RecommendationsRepository,
    EmbeddingProviderFactory,
    RecommendationStrategyRegistry,
    RecommendationEngineRegistry,
  ],
  exports: [
    RecommendationsService,
    SmartRecommendationService,
    RecommendationsRepository,
    ProductInteractionService,
  ],
})
class RecommendationsModule {}
