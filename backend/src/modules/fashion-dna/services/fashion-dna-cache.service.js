import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../database/redis.service';

const CACHE_KEY_PREFIX = 'fashion-dna:';
const CACHE_TTL_SECONDS = 24 * 60 * 60;

export @Injectable()
class FashionDnaCacheService {
  constructor(@Inject(RedisService) redisService) {
    this.redis = redisService;
    this.logger = new Logger(FashionDnaCacheService.name);
  }

  buildKey(userId) {
    return `${CACHE_KEY_PREFIX}${userId}`;
  }

  async get(userId) {
    const cached = await this.redis.get(this.buildKey(userId));

    if (!cached) {
      return null;
    }

    try {
      return JSON.parse(cached);
    } catch (error) {
      this.logger.warn(
        `Invalid Fashion DNA cache for user ${userId}: ${error.message}`,
      );
      await this.invalidate(userId);
      return null;
    }
  }

  async set(userId, fashionDna) {
    await this.redis.setex(
      this.buildKey(userId),
      CACHE_TTL_SECONDS,
      JSON.stringify(fashionDna),
    );
  }

  async invalidate(userId) {
    await this.redis.del(this.buildKey(userId));
  }
}
