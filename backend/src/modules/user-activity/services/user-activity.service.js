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
    const entry = await this.userActivityRepository.createSearchHistory(
      userId,
      query,
    );

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
}
