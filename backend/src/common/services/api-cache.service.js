import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../database/redis.service';

export @Injectable()
class ApiCacheService {
  constructor(@Inject(RedisService) redisService) {
    this.redis = redisService;
    this.logger = new Logger(ApiCacheService.name);
  }

  buildKey(namespace, ...parts) {
    const suffix = parts
      .filter((part) => part !== undefined && part !== null && part !== '')
      .map((part) => String(part))
      .join(':');

    return suffix ? `${namespace}:${suffix}` : namespace;
  }

  async get(key) {
    const cached = await this.redis.get(key);

    if (!cached) {
      return null;
    }

    try {
      return JSON.parse(cached);
    } catch (error) {
      this.logger.warn(`Invalid cache payload for ${key}: ${error.message}`);
      await this.redis.del(key);
      return null;
    }
  }

  async set(key, value, ttlSeconds) {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
  }

  async getOrSet(key, ttlSeconds, factory) {
    const cached = await this.get(key);

    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttlSeconds);
    return value;
  }

  async invalidate(key) {
    await this.redis.del(key);
  }

  async invalidatePattern(namespace, userId) {
    if (!userId) {
      return;
    }

    await this.invalidate(this.buildKey(namespace, userId));
  }
}

export { ApiCacheService };
