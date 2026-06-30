import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { PipelineEventModule } from './pipeline-event.module';
import { UserPipelineService } from './user-pipeline.service';

export @Module({
  imports: [PipelineEventModule, DatabaseModule],
  providers: [UserPipelineService],
  exports: [UserPipelineService, PipelineEventModule],
})
class UserPipelineModule {}
