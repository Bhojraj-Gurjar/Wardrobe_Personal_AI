import { Global, Module } from '@nestjs/common';
import { PipelineEventBus } from './pipeline-event.bus';

export @Global()
@Module({
  providers: [PipelineEventBus],
  exports: [PipelineEventBus],
})
class PipelineEventModule {}
