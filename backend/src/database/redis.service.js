import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export @Injectable()
class RedisService extends Redis {
  constructor(@Inject(ConfigService) configService) {
    super({
      host: configService.get('redis.host'),
      port: configService.get('redis.port'),
    });
  }

  async onModuleDestroy() {
    await this.quit();
  }
}
