import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { StorageModule } from '../../storage/storage.module';
import { UserArtifactsService } from './user-artifacts.service';

export @Global() @Module({
  imports: [DatabaseModule, StorageModule],
  providers: [UserArtifactsService],
  exports: [UserArtifactsService],
})
class UserArtifactsModule {}
