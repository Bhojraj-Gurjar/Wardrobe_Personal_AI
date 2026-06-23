import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FashionDnaModule } from '../fashion-dna/fashion-dna.module';
import { PipelineEventModule } from '../user-pipeline/pipeline-event.module';
import { StorageModule } from '../../storage/storage.module';
import { BodyAnalysisController } from './body-analysis.controller';
import { BodyAnalysisRepository } from './body-analysis.repository';
import { BodyAnalysisService } from './body-analysis.service';
import { BodyProfileInsightsService } from './services/body-profile-insights.service';
import { BodyAnalysisVectorService } from './services/body-analysis-vector.service';
import { BodyImageStorageService } from './services/body-image-storage.service';

export @Module({
  imports: [
    AuthModule,
    StorageModule,
    forwardRef(() => FashionDnaModule),
    PipelineEventModule,
  ],
  controllers: [BodyAnalysisController],
  providers: [
    BodyAnalysisService,
    BodyAnalysisRepository,
    BodyProfileInsightsService,
    BodyAnalysisVectorService,
    BodyImageStorageService,
  ],
  exports: [
    BodyAnalysisService,
    BodyAnalysisRepository,
    BodyProfileInsightsService,
    BodyAnalysisVectorService,
    BodyImageStorageService,
  ],
})
class BodyAnalysisModule {}
