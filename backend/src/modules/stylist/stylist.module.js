import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { StylistController } from './controllers/stylist.controller';
import { StylistService } from './services/stylist.service';
import { StylistRepository } from './repositories/stylist.repository';
import { StylistContextService } from './services/stylist-context.service';
import { StylistEngineService } from './services/stylist-engine.service';
import { StylistLlmService } from './services/stylist-llm.service';

export @Module({
  imports: [AuthModule, RecommendationsModule],
  controllers: [StylistController],
  providers: [
    StylistService,
    StylistRepository,
    StylistContextService,
    StylistEngineService,
    StylistLlmService,
  ],
  exports: [StylistService],
})
class StylistModule {}

export { StylistModule };
