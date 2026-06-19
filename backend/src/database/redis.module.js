import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

export @Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
class RedisModule {}
