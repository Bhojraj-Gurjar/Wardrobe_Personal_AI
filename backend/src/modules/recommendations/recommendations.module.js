import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RecommendationsController } from './controllers/recommendations.controller';
import { RecommendationsService } from './services/recommendations.service';
import { RecommendationsRepository } from './repositories/recommendations.repository';
import { EmbeddingProviderFactory } from './providers/embedding.provider';

export @Module({
  imports: [AuthModule],
  controllers: [RecommendationsController],
  providers: [
    RecommendationsService,
    RecommendationsRepository,
    EmbeddingProviderFactory,
  ],
  exports: [RecommendationsService],
})
class RecommendationsModule {}
