import { Inject, Injectable } from '@nestjs/common';
import { FashionDnaActivityRepository } from '../repositories/fashion-dna-activity.repository';

const WISHLIST_WEIGHT = 1;
const VIEW_WEIGHT = 1;
const PURCHASE_WEIGHT = 1;
const MAX_BRAND_AFFINITY = 10;

function rankTopBrandAffinity(brandCounts, limit = MAX_BRAND_AFFINITY) {
  const entries = Object.entries(brandCounts)
    .sort(([, left], [, right]) => right - left || 0)
    .slice(0, limit);

  if (!entries.length) {
    return {};
  }

  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return Object.fromEntries(
    entries.map(([key, count]) => [key, Number((count / total).toFixed(4))]),
  );
}

function computePriceAffinity(prices) {
  const validPrices = prices.filter((price) => Number(price) > 0);

  if (!validPrices.length) {
    return {};
  }

  const min = Math.min(...validPrices);
  const max = Math.max(...validPrices);
  const range = max - min || 1;
  const buckets = {
    low: 0,
    mid_low: 0,
    mid_high: 0,
    high: 0,
  };

  validPrices.forEach((price) => {
    const ratio = (price - min) / range;

    if (ratio < 0.25) {
      buckets.low += 1;
    } else if (ratio < 0.5) {
      buckets.mid_low += 1;
    } else if (ratio < 0.75) {
      buckets.mid_high += 1;
    } else {
      buckets.high += 1;
    }
  });

  return normalizeAffinity(buckets);
}

function normalizeAffinity(counts) {
  const entries = Object.entries(counts);

  if (!entries.length) {
    return {};
  }

  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return Object.fromEntries(
    entries.map(([key, count]) => [key, Number((count / total).toFixed(4))]),
  );
}

function extractSearchTerms(searches) {
  const termCounts = {};

  searches.forEach((entry) => {
    String(entry.query || '')
      .toLowerCase()
      .split(/\s+/)
      .map((term) => term.trim())
      .filter(Boolean)
      .forEach((term) => {
        termCounts[term] = (termCounts[term] || 0) + 1;
      });
  });

  return normalizeAffinity(termCounts);
}

export @Injectable()
class FashionDnaBehavioralService {
  constructor(@Inject(FashionDnaActivityRepository) activityRepository) {
    this.activityRepository = activityRepository;
  }

  async collectSignals(userId) {
    const [orders, wishlistItems, productViews, searchHistory] = await Promise.all([
      this.activityRepository.findOrders(userId),
      this.activityRepository.findWishlistProducts(userId),
      this.activityRepository.findRecentProductViews(userId),
      this.activityRepository.findRecentSearchHistory(userId),
    ]);

    const brandCounts = {};
    const categoryCounts = {};
    const interactionPrices = [];

    wishlistItems.forEach((item) => {
      const brandId = item.product?.brand_id;
      const categoryId = item.product?.category_id;
      const price = item.product?.price;

      if (brandId) {
        brandCounts[brandId] = (brandCounts[brandId] || 0) + WISHLIST_WEIGHT;
      }

      if (categoryId) {
        categoryCounts[categoryId] =
          (categoryCounts[categoryId] || 0) + WISHLIST_WEIGHT;
      }

      if (price) {
        interactionPrices.push(price);
      }
    });

    productViews.forEach((view) => {
      const brandId = view.product?.brand_id;
      const categoryId = view.product?.category_id;
      const price = view.product?.price;

      if (brandId) {
        brandCounts[brandId] = (brandCounts[brandId] || 0) + VIEW_WEIGHT;
      }

      if (categoryId) {
        categoryCounts[categoryId] =
          (categoryCounts[categoryId] || 0) + VIEW_WEIGHT;
      }

      if (price) {
        interactionPrices.push(price);
      }
    });

    orders.forEach((order) => {
      const brandId = order.product?.brand_id;

      if (brandId) {
        brandCounts[brandId] = (brandCounts[brandId] || 0) + PURCHASE_WEIGHT;
      }

      interactionPrices.push(order.total_amount);
    });

    const totalSpent = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const averageSpending = orders.length
      ? Number((totalSpent / orders.length).toFixed(2))
      : null;

    return {
      orders,
      wishlistItems,
      productViews,
      searchHistory,
      favoriteBrands: rankTopBrandAffinity(brandCounts),
      favoriteCategories: normalizeAffinity(categoryCounts),
      averageSpending,
      priceAffinity: computePriceAffinity(interactionPrices),
      searchTerms: extractSearchTerms(searchHistory),
      activityVolume: {
        orders: orders.length,
        wishlist: wishlistItems.length,
        product_views: productViews.length,
        searches: searchHistory.length,
      },
    };
  }

  buildHistoryPayload(signals) {
    return {
      favorite_brands: signals.favoriteBrands,
      favorite_categories: signals.favoriteCategories,
      average_spending: signals.averageSpending,
      price_affinity: signals.priceAffinity,
      search_terms: signals.searchTerms,
      activity_volume: signals.activityVolume,
    };
  }
}
