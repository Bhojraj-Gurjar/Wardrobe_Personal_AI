import { Global, Module } from '@nestjs/common';
import { QdrantService } from './qdrant.service';

export @Global()
@Module({
  providers: [QdrantService],
  exports: [QdrantService],
})
class QdrantModule {}
