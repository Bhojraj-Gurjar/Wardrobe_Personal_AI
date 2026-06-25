import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AvatarController } from './avatar.controller';
import { AvatarRepository } from './avatar.repository';
import { AvatarService } from './avatar.service';
import { AvatarOutfitService } from './avatar-outfit.service';

export @Module({
  imports: [AuthModule],
  controllers: [AvatarController],
  providers: [AvatarService, AvatarRepository, AvatarOutfitService],
  exports: [AvatarService, AvatarOutfitService, AvatarRepository],
})
class AvatarModule {}
