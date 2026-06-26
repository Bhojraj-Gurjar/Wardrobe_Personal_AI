import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BodyAnalysisModule } from '../body-analysis/body-analysis.module';
import { FaceAnalysisModule } from '../face-analysis/face-analysis.module';
import { FashionDnaController } from './controllers/fashion-dna.controller';
import { FashionDnaRepository } from './repositories/fashion-dna.repository';
import { FashionDnaActivityRepository } from './repositories/fashion-dna-activity.repository';
import { FashionDnaService } from './services/fashion-dna.service';
import { FashionDnaBehavioralService } from './services/fashion-dna-behavioral.service';
import { FashionDnaContextService } from './services/fashion-dna-context.service';
import { FashionDnaRefreshService } from './services/fashion-dna-refresh.service';
import { FashionDnaCacheService } from './services/fashion-dna-cache.service';
import { FashionDnaRegenerationService } from './services/fashion-dna-regeneration.service';
import { FashionDnaHistoryRepository } from './repositories/fashion-dna-history.repository';
import { FashionDnaHistoryService } from './services/fashion-dna-history.service';
import { FashionDnaVectorService } from './services/fashion-dna-vector.service';
import { FashionDnaEngineService } from './services/fashion-dna-engine.service';

export @Module({
  imports: [
    AuthModule,
    forwardRef(() => FaceAnalysisModule),
    forwardRef(() => BodyAnalysisModule),
  ],
  controllers: [FashionDnaController],
  providers: [
    FashionDnaService,
    FashionDnaRepository,
    FashionDnaActivityRepository,
    FashionDnaBehavioralService,
    FashionDnaContextService,
    FashionDnaEngineService,
    FashionDnaRefreshService,
    FashionDnaCacheService,
    FashionDnaRegenerationService,
    FashionDnaHistoryRepository,
    FashionDnaHistoryService,
    FashionDnaVectorService,
  ],
  exports: [
    FashionDnaService,
    FashionDnaRefreshService,
    FashionDnaCacheService,
    FashionDnaRegenerationService,
    FashionDnaHistoryService,
    FashionDnaVectorService,
    FashionDnaRepository,
  ],
})
class FashionDnaModule {}
