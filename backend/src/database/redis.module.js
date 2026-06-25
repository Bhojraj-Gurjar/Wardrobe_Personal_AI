import { Global, Module } from '@nestjs/common';
import { ApiCacheService } from '../common/services/api-cache.service';
import { RedisService } from './redis.service';

export @Global()
@Module({
  providers: [RedisService, ApiCacheService],
  exports: [RedisService, ApiCacheService],
})
class RedisModule {}
