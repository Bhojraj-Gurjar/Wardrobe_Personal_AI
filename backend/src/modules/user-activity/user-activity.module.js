import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FashionDnaModule } from '../fashion-dna/fashion-dna.module';
import { UserActivityController } from './controllers/user-activity.controller';
import { UserActivityService } from './services/user-activity.service';
import { UserActivityRepository } from './repositories/user-activity.repository';

export @Module({
  imports: [AuthModule, FashionDnaModule],
  controllers: [UserActivityController],
  providers: [UserActivityService, UserActivityRepository],
  exports: [UserActivityService],
})
class UserActivityModule {}
