import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FaceModule } from '../face/face.module';
import { FashionDnaModule } from '../fashion-dna/fashion-dna.module';
import { PipelineEventModule } from '../user-pipeline/pipeline-event.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FaceAnalysisController } from './face-analysis.controller';
import { FaceAnalysisRepository } from './face-analysis.repository';
import { FaceAnalysisService } from './face-analysis.service';
import { FaceBiometricTraitsService } from './services/face-biometric-traits.service';
import { FaceAnalysisVectorService } from './services/face-analysis-vector.service';

export @Module({
  imports: [
    AuthModule,
    FaceModule,
    forwardRef(() => FashionDnaModule),
    PipelineEventModule,
    NotificationsModule,
  ],
  controllers: [FaceAnalysisController],
  providers: [
    FaceAnalysisService,
    FaceAnalysisRepository,
    FaceBiometricTraitsService,
    FaceAnalysisVectorService,
  ],
  exports: [
    FaceAnalysisService,
    FaceAnalysisRepository,
    FaceBiometricTraitsService,
    FaceAnalysisVectorService,
  ],
})
class FaceAnalysisModule {}
