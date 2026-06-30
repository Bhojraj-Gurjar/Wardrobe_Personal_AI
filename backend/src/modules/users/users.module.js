import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BodyAnalysisModule } from '../body-analysis/body-analysis.module';
import { FashionDnaModule } from '../fashion-dna/fashion-dna.module';
import { PipelineEventModule } from '../user-pipeline/pipeline-event.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { UsersRepository } from './repositories/users.repository';

export @Module({
  imports: [
    AuthModule,
    FashionDnaModule,
    forwardRef(() => BodyAnalysisModule),
    PipelineEventModule,
    NotificationsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
class UsersModule {}
