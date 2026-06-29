import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FashionDnaModule } from '../fashion-dna/fashion-dna.module';
import { UserPipelineModule } from '../user-pipeline/user-pipeline.module';
import { StorageModule } from '../../storage/storage.module';
import { FaceController } from './controllers/face.controller';
import { FaceService } from './services/face.service';
import { FaceImageStorageService } from './services/face-image-storage.service';
import { FaceRateLimitService } from './services/face-rate-limit.service';
import { FaceRepository } from './repositories/face.repository';

export @Module({
  imports: [
    AuthModule,
    StorageModule,
    forwardRef(() => FashionDnaModule),
    forwardRef(() => UserPipelineModule),
  ],
  controllers: [FaceController],
  providers: [FaceService, FaceImageStorageService, FaceRateLimitService, FaceRepository],
  exports: [FaceService, FaceRepository, FaceImageStorageService, FaceRateLimitService],
})
class FaceModule {}
