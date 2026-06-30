import { Global, Module } from '@nestjs/common';
import { AiService } from './services/ai.service';

export @Global()
@Module({
  providers: [AiService],
  exports: [AiService],
})
class AiModule {}

export { AiModule };
