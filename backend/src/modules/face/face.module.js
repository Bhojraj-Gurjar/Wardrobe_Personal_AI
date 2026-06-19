import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FaceController } from './controllers/face.controller';
import { FaceService } from './services/face.service';
import { FaceRepository } from './repositories/face.repository';

export @Module({
  imports: [AuthModule],
  controllers: [FaceController],
  providers: [FaceService, FaceRepository],
  exports: [FaceService],
})
class FaceModule {}
