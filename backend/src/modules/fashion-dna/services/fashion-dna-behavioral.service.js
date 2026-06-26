import { Inject, Injectable } from '@nestjs/common';
import { FashionDnaActivityRepository } from '../repositories/fashion-dna-activity.repository';
import { inferProductType } from '../../products/constants/product-type.constants';
import { normalizeKey } from '../utils/fashion-dna-product-style.util';

const SOURCE_WEIGHTS = {
  order: 5,
  purchase: 5,
  closet: 4,
  cart: 3,
  wishlist: 2,
  try_on: 2,
  virtual_try_on: 2,
  saved_look: 2,
  view: 1,
  onboarding_brand: 1,
  onboarding_color: 1,
};

function resolveProductTypeKey(product) {
  return inferProductType(product);
}

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

function resolveBrandKey(product) {
  return normalizeKey(product?.brand || product?.brand_id || '');
}

function addProductInteraction(
  interactions,
  product,
  source,
  timestamp = null,
  multiplier = 1,
) {
  if (!product) {
    return;
  }

  interactions.push({
    product,
    source,
    weight: (SOURCE_WEIGHTS[source] || 1) * multiplier,
    timestamp: timestamp || new Date().toISOString(),
  });
}

function incrementCount(counts, key, amount = 1) {
  if (!key) {
    return;
  }

  counts[key] = (counts[key] || 0) + amount;
}

export @Injectable()
class FashionDnaBehavioralService {
  constructor(@Inject(FashionDnaActivityRepository) activityRepository) {
    this.activityRepository = activityRepository;
  }

  async collectSignals(userId, preferences = {}) {
    const [
      orders,
      wishlistItems,
      cartItems,
      closetItems,
      productViews,
      baselineViews,
      searchHistory,
      tryOnResults,
      virtualTryOnResults,
      savedOutfits,
      stylistSessions,
      favoriteBrands,
      favoriteColors,
    ] = await Promise.all([
      this.activityRepository.findOrders(userId),
      this.activityRepository.findWishlistProducts(userId),
      this.activityRepository.findCartItems(userId),
      this.activityRepository.findClosetProducts(userId),
      this.activityRepository.findRecentProductViews(userId),
      this.activityRepository.findBaselineProductViews(userId),
      this.activityRepository.findRecentSearchHistory(userId),
      this.activityRepository.findTryOnResults(userId),
      this.activityRepository.findVirtualTryOnResults(userId),
      this.activityRepository.findSavedOutfits(userId),
      this.activityRepository.countStylistSessions(userId),
      this.activityRepository.findFavoriteBrands(userId),
      this.activityRepository.findFavoriteColors(userId),
    ]);

    const brandCounts = {};
    const categoryCounts = {};
    const productTypeCounts = {};
    const colorCounts = {};
    const interactionPrices = [];
    const productInteractions = [];
    const recentInteractions = [];
    const baselineInteractions = [];

    wishlistItems.forEach((item) => {
      addProductInteraction(productInteractions, item.product, 'wishlist', item.created_at);
      recentInteractions.push({
        product: item.product,
        weight: SOURCE_WEIGHTS.wishlist,
      });
      incrementCount(brandCounts, resolveBrandKey(item.product), SOURCE_WEIGHTS.wishlist);
      incrementCount(categoryCounts, item.product?.category_id, SOURCE_WEIGHTS.wishlist);
      incrementCount(productTypeCounts, resolveProductTypeKey(item.product), SOURCE_WEIGHTS.wishlist);
      incrementCount(colorCounts, normalizeKey(item.product?.color), SOURCE_WEIGHTS.wishlist);
      if (item.product?.price) {
        interactionPrices.push(item.product.price);
      }
    });

    cartItems.forEach((item) => {
      addProductInteraction(
        productInteractions,
        item.product,
        'cart',
        item.updated_at,
        item.quantity || 1,
      );
      recentInteractions.push({
        product: item.product,
        weight: SOURCE_WEIGHTS.cart * (item.quantity || 1),
      });
      incrementCount(brandCounts, resolveBrandKey(item.product), SOURCE_WEIGHTS.cart);
      incrementCount(categoryCounts, item.product?.category_id, SOURCE_WEIGHTS.cart);
      incrementCount(productTypeCounts, resolveProductTypeKey(item.product), SOURCE_WEIGHTS.cart);
      if (item.product?.price) {
        interactionPrices.push(item.product.price);
      }
    });

    closetItems.forEach((item) => {
      addProductInteraction(productInteractions, item.product, 'closet', item.purchased_at);
      recentInteractions.push({
        product: item.product,
        weight: SOURCE_WEIGHTS.closet,
      });
      incrementCount(brandCounts, resolveBrandKey(item.product), SOURCE_WEIGHTS.closet);
      incrementCount(categoryCounts, item.product?.category_id, SOURCE_WEIGHTS.closet);
      incrementCount(productTypeCounts, resolveProductTypeKey(item.product), SOURCE_WEIGHTS.closet);
      incrementCount(colorCounts, normalizeKey(item.product?.color), SOURCE_WEIGHTS.closet);
      if (item.product?.price) {
        interactionPrices.push(item.product.price);
      }
    });

    productViews.forEach((view) => {
      addProductInteraction(productInteractions, view.product, 'view', view.viewed_at);
      recentInteractions.push({
        product: view.product,
        weight: SOURCE_WEIGHTS.view,
      });
      incrementCount(brandCounts, resolveBrandKey(view.product), SOURCE_WEIGHTS.view);
      incrementCount(categoryCounts, view.product?.category_id, SOURCE_WEIGHTS.view);
      incrementCount(productTypeCounts, resolveProductTypeKey(view.product), SOURCE_WEIGHTS.view);
      incrementCount(colorCounts, normalizeKey(view.product?.color), SOURCE_WEIGHTS.view);
      if (view.product?.price) {
        interactionPrices.push(view.product.price);
      }
    });

    baselineViews.forEach((view) => {
      baselineInteractions.push({
        product: view.product,
        weight: SOURCE_WEIGHTS.view,
      });
    });

    orders.forEach((order) => {
      addProductInteraction(productInteractions, order.product, 'order', order.created_at);
      recentInteractions.push({
        product: order.product,
        weight: SOURCE_WEIGHTS.order,
      });
      incrementCount(brandCounts, resolveBrandKey(order.product), SOURCE_WEIGHTS.order);
      incrementCount(categoryCounts, order.product?.category_id, SOURCE_WEIGHTS.order);
      incrementCount(productTypeCounts, resolveProductTypeKey(order.product), SOURCE_WEIGHTS.order);
      incrementCount(colorCounts, normalizeKey(order.product?.color), SOURCE_WEIGHTS.order);
      interactionPrices.push(order.total_amount);
      if (order.product?.price) {
        interactionPrices.push(order.product.price);
      }
    });

    tryOnResults.forEach((result) => {
      addProductInteraction(productInteractions, result.product, 'try_on', result.created_at);
      recentInteractions.push({
        product: result.product,
        weight: SOURCE_WEIGHTS.try_on,
      });
      incrementCount(brandCounts, resolveBrandKey(result.product), SOURCE_WEIGHTS.try_on);
      incrementCount(categoryCounts, result.product?.category_id, SOURCE_WEIGHTS.try_on);
      incrementCount(productTypeCounts, resolveProductTypeKey(result.product), SOURCE_WEIGHTS.try_on);
    });

    virtualTryOnResults.forEach((result) => {
      recentInteractions.push({
        product: result.selected_products?.[0] || null,
        weight: SOURCE_WEIGHTS.virtual_try_on,
      });
    });

    savedOutfits.forEach((outfit) => {
      recentInteractions.push({
        product: null,
        weight: SOURCE_WEIGHTS.saved_look,
      });
    });

    favoriteBrands.forEach((brand) => {
      incrementCount(
        brandCounts,
        normalizeKey(brand.brand_name),
        Math.max(1, brand.interaction_count || 1),
      );
    });

    const onboardingBrands = Array.isArray(preferences.favorite_brands)
      ? preferences.favorite_brands
      : [];
    onboardingBrands.forEach((brand) => {
      incrementCount(brandCounts, normalizeKey(brand), SOURCE_WEIGHTS.onboarding_brand);
    });

    const onboardingColors = Array.isArray(preferences.favorite_colors)
      ? preferences.favorite_colors
      : [];
    onboardingColors.forEach((color) => {
      incrementCount(colorCounts, normalizeKey(color), SOURCE_WEIGHTS.onboarding_color);
    });

    favoriteColors.forEach((color) => {
      incrementCount(
        colorCounts,
        normalizeKey(color.color_name),
        Math.max(1, Math.round(color.usage_percent || 1)),
      );
    });

    const cartPrices = cartItems
      .map((item) => Number(item.product?.price))
      .filter((price) => price > 0);
    const cartAveragePrice = cartPrices.length
      ? cartPrices.reduce((sum, price) => sum + price, 0) / cartPrices.length
      : null;

    const totalSpent = orders.reduce((sum, order) => sum + order.total_amount, 0);
    const averageSpending = orders.length
      ? Number((totalSpent / orders.length).toFixed(2))
      : null;

    return {
      orders,
      wishlistItems,
      cartItems,
      closetItems,
      productViews,
      searchHistory,
      tryOnResults,
      virtualTryOnResults,
      savedOutfits,
      favoriteBrands,
      favoriteColors,
      favoriteBrandsRanked: rankTopBrandAffinity(brandCounts),
      favoriteCategories: normalizeAffinity(categoryCounts),
      favoriteProductTypes: normalizeAffinity(productTypeCounts),
      brandCounts,
      colorCounts,
      productTypeCounts,
      favoriteColorsList: [
        ...onboardingColors,
        ...favoriteColors.map((entry) => entry.color_name),
      ],
      averageSpending,
      cartAveragePrice,
      priceAffinity: computePriceAffinity(interactionPrices),
      searchTerms: extractSearchTerms(searchHistory),
      productInteractions,
      recentInteractions,
      baselineInteractions,
      activityVolume: {
        orders: orders.length,
        wishlist: wishlistItems.length,
        cart: cartItems.length,
        closet: closetItems.length,
        product_views: productViews.length,
        searches: searchHistory.length,
        try_on: tryOnResults.length,
        virtual_try_on: virtualTryOnResults.length,
        saved_looks: savedOutfits.length,
        stylist_sessions: stylistSessions,
      },
    };
  }

  buildHistoryPayload(signals) {
    return {
      favorite_brands: signals.favoriteBrandsRanked,
      favorite_categories: signals.favoriteCategories,
      favorite_product_types: signals.favoriteProductTypes,
      average_spending: signals.averageSpending,
      cart_average_price: signals.cartAveragePrice,
      price_affinity: signals.priceAffinity,
      search_terms: signals.searchTerms,
      activity_volume: signals.activityVolume,
      color_counts: signals.colorCounts,
    };
  }
}
