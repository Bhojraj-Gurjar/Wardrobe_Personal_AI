import { Global, Module } from '@nestjs/common';
import { StorageService } from './services/storage.service';
import { StoragePathResolver } from './services/storage-path-resolver.service';

export @Global()
@Module({
  providers: [StorageService, StoragePathResolver],
  exports: [StorageService, StoragePathResolver],
})
class StorageModule {}
