import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { REFRESH_SOURCES } from '../../fashion-dna/constants/fashion-dna-regeneration.constants';
import { FashionDnaRegenerationService } from '../../fashion-dna/services/fashion-dna-regeneration.service';
import { UserActivityRepository } from '../repositories/user-activity.repository';

export @Injectable()
class UserActivityService {
  constructor(
    @Inject(UserActivityRepository) userActivityRepository,
    @Inject(FashionDnaRegenerationService) fashionDnaRegenerationService,
  ) {
    this.userActivityRepository = userActivityRepository;
    this.fashionDnaRegenerationService = fashionDnaRegenerationService;
  }

  async recordProductView(userId, productId) {
    const product = await this.userActivityRepository.productExists(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const view = await this.userActivityRepository.createProductView(
      userId,
      productId,
    );

    this.fashionDnaRegenerationService.trigger(
      userId,
      REFRESH_SOURCES.BROWSING_ACTIVITY,
    );

    return {
      id: view.id,
      product_id: view.product_id,
      viewed_at: view.viewed_at,
    };
  }

  async recordSearch(userId, query) {
    const normalized = String(query || '').trim();

    if (!normalized) {
      return null;
    }

    const entry = await this.userActivityRepository.createSearchHistory(
      userId,
      normalized,
    );

    await this.pruneSearchHistory(userId);

    this.fashionDnaRegenerationService.trigger(
      userId,
      REFRESH_SOURCES.BROWSING_ACTIVITY,
    );

    return {
      id: entry.id,
      query: entry.query,
      searched_at: entry.searched_at,
    };
  }

  async getRecentSearches(userId, limit = 10) {
    const rows = await this.userActivityRepository.findRecentSearches(userId, 50);
    const seen = new Set();
    const items = [];

    rows.forEach((row) => {
      const key = row.query.trim().toLowerCase();
      if (!key || seen.has(key)) {
        return;
      }

      seen.add(key);
      items.push({
        id: row.id,
        query: row.query,
        searchedAt: row.searched_at,
      });
    });

    return { items: items.slice(0, limit) };
  }

  async clearSearchHistory(userId) {
    await this.userActivityRepository.deleteSearchHistory(userId);
    return { success: true };
  }

  async pruneSearchHistory(userId, keep = 10) {
    const rows = await this.userActivityRepository.findRecentSearches(userId, 50);
    const seen = new Set();
    const keepIds = [];

    rows.forEach((row) => {
      const key = row.query.trim().toLowerCase();
      if (!key || seen.has(key)) {
        return;
      }

      seen.add(key);
      keepIds.push(row.id);
    });

    const allowedIds = new Set(keepIds.slice(0, keep));
    const deleteIds = rows
      .map((row) => row.id)
      .filter((id) => !allowedIds.has(id));

    if (deleteIds.length) {
      await this.userActivityRepository.deleteSearchHistoryByIds(userId, deleteIds);
    }
  }
}
