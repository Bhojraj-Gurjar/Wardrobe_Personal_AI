import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BodyAnalysisModule } from '../body-analysis/body-analysis.module';
import { FaceAnalysisModule } from '../face-analysis/face-analysis.module';
import { FashionDnaModule } from '../fashion-dna/fashion-dna.module';
import { UsersModule } from '../users/users.module';
import { DigitalAvatarController } from './digital-avatar.controller';
import { DigitalAvatarRepository } from './digital-avatar.repository';
import { DigitalAvatarService } from './digital-avatar.service';
import { AvatarImageStorageService } from './services/avatar-image-storage.service';
import { DigitalAvatarVectorService } from './services/digital-avatar-vector.service';

export @Module({
  imports: [
    AuthModule,
    UsersModule,
    forwardRef(() => FaceAnalysisModule),
    forwardRef(() => BodyAnalysisModule),
    forwardRef(() => FashionDnaModule),
  ],
  controllers: [DigitalAvatarController],
  providers: [
    DigitalAvatarService,
    DigitalAvatarRepository,
    AvatarImageStorageService,
    DigitalAvatarVectorService,
  ],
  exports: [DigitalAvatarService, DigitalAvatarRepository, DigitalAvatarVectorService],
})
class DigitalAvatarModule {}
