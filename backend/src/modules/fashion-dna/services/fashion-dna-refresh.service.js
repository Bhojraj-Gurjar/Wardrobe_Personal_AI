import { Inject, Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../database/redis.service';
import { AiService } from '../../ai/services/ai.service';
import { FashionDnaRepository } from '../repositories/fashion-dna.repository';
import { FashionDnaService } from './fashion-dna.service';
import { FashionDnaContextService } from './fashion-dna-context.service';
import { FashionDnaCacheService } from './fashion-dna-cache.service';
import { FashionDnaHistoryService } from './fashion-dna-history.service';

const REFRESH_DEBOUNCE_MS = 3000;
const REFRESH_LOCK_PREFIX = 'fashion-dna:refresh:';
const REFRESH_SCHEDULED_PREFIX = 'fashion-dna:scheduled:';
const REFRESH_LOCK_SECONDS = 60;
const REFRESH_SCHEDULED_SECONDS = Math.ceil(REFRESH_DEBOUNCE_MS / 1000) + 10;

export @Injectable()
class FashionDnaRefreshService {
  constructor(
    @Inject(FashionDnaRepository) fashionDnaRepository,
    @Inject(FashionDnaContextService) contextService,
    @Inject(FashionDnaService) fashionDnaService,
    @Inject(AiService) aiService,
    @Inject(RedisService) redisService,
    @Inject(FashionDnaCacheService) cacheService,
    @Inject(FashionDnaHistoryService) historyService,
  ) {
    this.fashionDnaRepository = fashionDnaRepository;
    this.contextService = contextService;
    this.fashionDnaService = fashionDnaService;
    this.aiService = aiService;
    this.redis = redisService;
    this.cacheService = cacheService;
    this.historyService = historyService;
    this.logger = new Logger(FashionDnaRefreshService.name);
    this.pendingRefreshes = new Map();
  }

  scheduleRegeneration(userId, source = 'activity') {
    this.cacheService.invalidate(userId).catch((error) => {
      this.logger.warn(
        `Failed to invalidate Fashion DNA cache for user ${userId}: ${error.message}`,
      );
    });

    this.markScheduled(userId, source);

    const pending = this.pendingRefreshes.get(userId);

    if (pending?.timer) {
      clearTimeout(pending.timer);
    }

    const timer = setTimeout(() => {
      const scheduled = this.pendingRefreshes.get(userId);
      this.pendingRefreshes.delete(userId);

      const refreshSource = scheduled?.source || source;

      this.runRefresh(userId, refreshSource).catch((error) => {
        this.logger.error(
          `Failed to refresh Fashion DNA for user ${userId}: ${error.message}`,
          error.stack,
        );
      });
    }, REFRESH_DEBOUNCE_MS);

    this.pendingRefreshes.set(userId, { timer, source });
  }

  scheduleRefresh(userId, source = 'activity') {
    this.scheduleRegeneration(userId, source);
  }

  markScheduled(userId, source) {
    this.redis
      .set(
        `${REFRESH_SCHEDULED_PREFIX}${userId}`,
        source,
        'EX',
        REFRESH_SCHEDULED_SECONDS,
      )
      .catch((error) => {
        this.logger.warn(
          `Failed to mark Fashion DNA regeneration scheduled for user ${userId}: ${error.message}`,
        );
      });
  }

  async runRefresh(userId, source) {
    const lockKey = `${REFRESH_LOCK_PREFIX}${userId}`;
    const acquired = await this.redis.set(
      lockKey,
      source,
      'EX',
      REFRESH_LOCK_SECONDS,
      'NX',
    );

    if (!acquired) {
      this.logger.debug(
        `Fashion DNA regeneration already running for user ${userId}`,
      );
      return null;
    }

    try {
      await this.redis.del(`${REFRESH_SCHEDULED_PREFIX}${userId}`).catch(() => null);
      return await this.regenerateFashionDna(userId, source);
    } finally {
      await this.redis.del(lockKey).catch(() => null);
    }
  }

  async regenerateFashionDna(userId, source = 'activity') {
    const existing = await this.fashionDnaRepository.findByUserId(userId);

    if (!existing) {
      const generated = await this.fashionDnaService.generateFashionDnaIfReady(userId);

      if (generated) {
        this.logger.log(
          `Fashion DNA initial generation from ${source} | userId=${userId}`,
        );
      }

      return generated;
    }

    if (!this.aiService.isConfigured()) {
      this.logger.debug(
        `Skipping Fashion DNA refresh for user ${userId} — AI service not configured`,
      );
      return null;
    }

    const context = await this.contextService.collectContext(userId);
    const payload = await this.fashionDnaService.analyzeWithAi(userId, context);

    await this.historyService.archiveBeforeChange(existing, source);

    const updated = await this.fashionDnaRepository.updateByUserId(
      userId,
      payload,
    );

    const formatted = await this.fashionDnaService.formatFashionDna(
      updated,
      userId,
    );

    await this.cacheService.invalidate(userId);
    await this.cacheService.set(userId, formatted);

    this.logger.log(
      `Fashion DNA regenerated from ${source} | userId=${userId} | activityVolume=${JSON.stringify(context.signals.activityVolume)}`,
    );

    return updated;
  }

  async refreshFromActivity(userId, source = 'activity') {
    return this.regenerateFashionDna(userId, source);
  }
}
