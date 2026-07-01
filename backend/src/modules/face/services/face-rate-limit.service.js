import { HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../../database/redis.service';

const ATTEMPT_PREFIX = 'face:auth:attempts:';
const LOCK_PREFIX = 'face:auth:lock:';

export @Injectable()
class FaceRateLimitService {
  constructor(@Inject(RedisService) redisService, @Inject(ConfigService) configService) {
    this.redisService = redisService;
    this.logger = new Logger(FaceRateLimitService.name);
    this.maxAttempts = parseInt(configService.get('face.maxFailedAttempts'), 10) || 5;
    this.lockSeconds = parseInt(configService.get('face.lockoutSeconds'), 10) || 900;
    this.attemptTtlSeconds = parseInt(configService.get('face.attemptWindowSeconds'), 10) || 3600;
  }

  buildKey(scope, identifier) {
    return `${scope}:${String(identifier || 'anonymous').trim().toLowerCase()}`;
  }

  async assertNotLocked(scope, identifier) {
    const lockKey = `${LOCK_PREFIX}${this.buildKey(scope, identifier)}`;
    const locked = await this.redisService.get(lockKey);

    if (locked) {
      this.logger.warn(`Face auth locked | scope=${scope} | identifier=${identifier}`);
      throw new HttpException(
        'Too many failed face authentication attempts. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async recordFailure(scope, identifier, meta = {}) {
    const attemptKey = `${ATTEMPT_PREFIX}${this.buildKey(scope, identifier)}`;
    const attempts = await this.redisService.incr(attemptKey);

    if (attempts === 1) {
      await this.redisService.expire(attemptKey, this.attemptTtlSeconds);
    }

    this.logger.warn(
      `Face auth failure | scope=${scope} | identifier=${identifier} | attempts=${attempts}/${this.maxAttempts} | meta=${JSON.stringify(meta)}`,
    );

    if (attempts >= this.maxAttempts) {
      const lockKey = `${LOCK_PREFIX}${this.buildKey(scope, identifier)}`;
      await this.redisService.setex(lockKey, this.lockSeconds, '1');
      await this.redisService.del(attemptKey);
      throw new HttpException(
        'Too many failed face authentication attempts. Try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return attempts;
  }

  async recordSuccess(scope, identifier) {
    const attemptKey = `${ATTEMPT_PREFIX}${this.buildKey(scope, identifier)}`;
    await this.redisService.del(attemptKey);
  }
}
