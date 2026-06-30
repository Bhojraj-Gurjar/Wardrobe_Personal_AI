import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { UserMediaController } from './controllers/user-media.controller';
import { UserMediaRepository } from './repositories/user-media.repository';
import { UserMediaService } from './services/user-media.service';
import { UserMediaRegistryService } from './services/user-media-registry.service';

export @Global()
@Module({
  imports: [DatabaseModule],
  controllers: [UserMediaController],
  providers: [UserMediaRepository, UserMediaService, UserMediaRegistryService],
  exports: [UserMediaService, UserMediaRegistryService],
})
class UserMediaModule {}

export { UserMediaModule };
