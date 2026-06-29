"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "FashionDnaBehavioralService", {
    enumerable: true,
    get: function() {
        return FashionDnaBehavioralService;
    }
});
const _common = require("@nestjs/common");
const _fashiondnaactivityrepository = require("../repositories/fashion-dna-activity.repository");
const _producttypeconstants = require("../../products/constants/product-type.constants");
const _fashiondnaproductstyleutil = require("../utils/fashion-dna-product-style.util");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
const MAX_BRAND_AFFINITY = 8;
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
    onboarding_color: 1
};
function resolveProductTypeKey(product) {
    return (0, _producttypeconstants.inferProductType)(product);
}
function rankTopBrandAffinity(brandCounts, limit = MAX_BRAND_AFFINITY) {
    const entries = Object.entries(brandCounts).sort(([, left], [, right])=>right - left || 0).slice(0, limit);
    if (!entries.length) {
        return {};
    }
    const total = entries.reduce((sum, [, count])=>sum + count, 0);
    return Object.fromEntries(entries.map(([key, count])=>[
            key,
            Number((count / total).toFixed(4))
        ]));
}
function computePriceAffinity(prices) {
    const validPrices = prices.filter((price)=>Number(price) > 0);
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
        high: 0
    };
    validPrices.forEach((price)=>{
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
    const total = entries.reduce((sum, [, count])=>sum + count, 0);
    return Object.fromEntries(entries.map(([key, count])=>[
            key,
            Number((count / total).toFixed(4))
        ]));
}
function extractSearchTerms(searches) {
    const termCounts = {};
    searches.forEach((entry)=>{
        String(entry.query || '').toLowerCase().split(/\s+/).map((term)=>term.trim()).filter(Boolean).forEach((term)=>{
            termCounts[term] = (termCounts[term] || 0) + 1;
        });
    });
    return normalizeAffinity(termCounts);
}
function buildSearchBehaviour(searchHistory = []) {
    const recentQueries = searchHistory.slice(0, 8).map((entry)=>String(entry.query || '').trim()).filter(Boolean);
    const termCounts = {};
    searchHistory.forEach((entry)=>{
        const normalized = String(entry.query || '').trim().toLowerCase();
        if (normalized) {
            termCounts[normalized] = (termCounts[normalized] || 0) + 1;
        }
    });
    const topSearches = Object.entries(termCounts).sort(([, left], [, right])=>right - left).slice(0, 6).map(([query, count])=>({
            query,
            count
        }));
    return {
        totalSearches: searchHistory.length,
        recentQueries,
        topSearches,
        searchTerms: extractSearchTerms(searchHistory)
    };
}
function buildDiscountPreference(orders = [], interactions = []) {
    const discounts = [];
    orders.forEach((order)=>{
        const product = order.product;
        const mrp = Number(product?.mrp || product?.compare_at_price || 0);
        const price = Number(product?.price || order.total_amount || 0);
        if (mrp > price && mrp > 0) {
            discounts.push((mrp - price) / mrp * 100);
        }
    });
    interactions.forEach(({ product })=>{
        const mrp = Number(product?.mrp || 0);
        const price = Number(product?.price || 0);
        if (mrp > price && mrp > 0) {
            discounts.push((mrp - price) / mrp * 100);
        }
    });
    if (!discounts.length) {
        return {
            preference: 'neutral',
            averageDiscountPercent: 0
        };
    }
    const averageDiscountPercent = Math.round(discounts.reduce((sum, value)=>sum + value, 0) / discounts.length);
    return {
        preference: averageDiscountPercent >= 25 ? 'deal_seeker' : averageDiscountPercent >= 10 ? 'value_conscious' : 'full_price',
        averageDiscountPercent
    };
}
function buildRecentlyInfluenced(recentInteractions = []) {
    const weighted = new Map();
    recentInteractions.forEach((entry)=>{
        const product = entry.product;
        if (!product?.id) {
            return;
        }
        const existing = weighted.get(product.id) || {
            product,
            weight: 0,
            sources: new Set()
        };
        existing.weight += entry.weight || 1;
        if (entry.source) {
            existing.sources.add(entry.source);
        }
        weighted.set(product.id, existing);
    });
    return [
        ...weighted.values()
    ].sort((left, right)=>right.weight - left.weight).slice(0, 6).map((entry)=>({
            productId: entry.product.id,
            name: entry.product.name,
            brand: entry.product.brand || entry.product.brand_id,
            category: entry.product.category || entry.product.category_id,
            weight: entry.weight,
            sources: [
                ...entry.sources
            ]
        }));
}
function buildShoppingInfluence(signals) {
    const volume = signals.activityVolume || {};
    return {
        productViews: volume.product_views || 0,
        wishlistAdds: volume.wishlist || 0,
        cartAdds: volume.cart || 0,
        purchases: volume.orders || 0,
        tryOns: (volume.try_on || 0) + (volume.virtual_try_on || 0),
        savedLooks: volume.saved_looks || 0,
        stylistSessions: volume.stylist_sessions || 0,
        searches: volume.searches || 0,
        favoriteCategories: signals.favoriteCategories || {},
        favoriteBrands: signals.favoriteBrandsRanked || {},
        priceAffinity: signals.priceAffinity || {},
        averageSpending: signals.averageSpending,
        cartAveragePrice: signals.cartAveragePrice
    };
}
function resolveBrandKey(product) {
    return (0, _fashiondnaproductstyleutil.normalizeKey)(product?.brand || product?.brand_id || '');
}
function addProductInteraction(interactions, product, source, timestamp = null, multiplier = 1) {
    if (!product) {
        return;
    }
    interactions.push({
        product,
        source,
        weight: (SOURCE_WEIGHTS[source] || 1) * multiplier,
        timestamp: timestamp || new Date().toISOString()
    });
}
function incrementCount(counts, key, amount = 1) {
    if (!key) {
        return;
    }
    counts[key] = (counts[key] || 0) + amount;
}
let FashionDnaBehavioralService = class FashionDnaBehavioralService {
    constructor(activityRepository){
        this.activityRepository = activityRepository;
    }
    async collectSignals(userId, preferences = {}) {
        const [orders, wishlistItems, cartItems, closetItems, productViews, baselineViews, searchHistory, tryOnResults, virtualTryOnResults, savedOutfits, stylistSessions, favoriteBrands, favoriteColors] = await Promise.all([
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
            this.activityRepository.findFavoriteColors(userId)
        ]);
        const brandCounts = {};
        const categoryCounts = {};
        const productTypeCounts = {};
        const colorCounts = {};
        const interactionPrices = [];
        const productInteractions = [];
        const recentInteractions = [];
        const baselineInteractions = [];
        wishlistItems.forEach((item)=>{
            addProductInteraction(productInteractions, item.product, 'wishlist', item.created_at);
            recentInteractions.push({
                product: item.product,
                weight: SOURCE_WEIGHTS.wishlist
            });
            incrementCount(brandCounts, resolveBrandKey(item.product), SOURCE_WEIGHTS.wishlist);
            incrementCount(categoryCounts, item.product?.category_id, SOURCE_WEIGHTS.wishlist);
            incrementCount(productTypeCounts, resolveProductTypeKey(item.product), SOURCE_WEIGHTS.wishlist);
            incrementCount(colorCounts, (0, _fashiondnaproductstyleutil.normalizeKey)(item.product?.color), SOURCE_WEIGHTS.wishlist);
            if (item.product?.price) {
                interactionPrices.push(item.product.price);
            }
        });
        cartItems.forEach((item)=>{
            addProductInteraction(productInteractions, item.product, 'cart', item.updated_at, item.quantity || 1);
            recentInteractions.push({
                product: item.product,
                weight: SOURCE_WEIGHTS.cart * (item.quantity || 1)
            });
            incrementCount(brandCounts, resolveBrandKey(item.product), SOURCE_WEIGHTS.cart);
            incrementCount(categoryCounts, item.product?.category_id, SOURCE_WEIGHTS.cart);
            incrementCount(productTypeCounts, resolveProductTypeKey(item.product), SOURCE_WEIGHTS.cart);
            if (item.product?.price) {
                interactionPrices.push(item.product.price);
            }
        });
        closetItems.forEach((item)=>{
            addProductInteraction(productInteractions, item.product, 'closet', item.purchased_at);
            recentInteractions.push({
                product: item.product,
                weight: SOURCE_WEIGHTS.closet
            });
            incrementCount(brandCounts, resolveBrandKey(item.product), SOURCE_WEIGHTS.closet);
            incrementCount(categoryCounts, item.product?.category_id, SOURCE_WEIGHTS.closet);
            incrementCount(productTypeCounts, resolveProductTypeKey(item.product), SOURCE_WEIGHTS.closet);
            incrementCount(colorCounts, (0, _fashiondnaproductstyleutil.normalizeKey)(item.product?.color), SOURCE_WEIGHTS.closet);
            if (item.product?.price) {
                interactionPrices.push(item.product.price);
            }
        });
        productViews.forEach((view)=>{
            addProductInteraction(productInteractions, view.product, 'view', view.viewed_at);
            recentInteractions.push({
                product: view.product,
                weight: SOURCE_WEIGHTS.view
            });
            incrementCount(brandCounts, resolveBrandKey(view.product), SOURCE_WEIGHTS.view);
            incrementCount(categoryCounts, view.product?.category_id, SOURCE_WEIGHTS.view);
            incrementCount(productTypeCounts, resolveProductTypeKey(view.product), SOURCE_WEIGHTS.view);
            incrementCount(colorCounts, (0, _fashiondnaproductstyleutil.normalizeKey)(view.product?.color), SOURCE_WEIGHTS.view);
            if (view.product?.price) {
                interactionPrices.push(view.product.price);
            }
        });
        baselineViews.forEach((view)=>{
            baselineInteractions.push({
                product: view.product,
                weight: SOURCE_WEIGHTS.view
            });
        });
        orders.forEach((order)=>{
            addProductInteraction(productInteractions, order.product, 'order', order.created_at);
            recentInteractions.push({
                product: order.product,
                weight: SOURCE_WEIGHTS.order
            });
            incrementCount(brandCounts, resolveBrandKey(order.product), SOURCE_WEIGHTS.order);
            incrementCount(categoryCounts, order.product?.category_id, SOURCE_WEIGHTS.order);
            incrementCount(productTypeCounts, resolveProductTypeKey(order.product), SOURCE_WEIGHTS.order);
            incrementCount(colorCounts, (0, _fashiondnaproductstyleutil.normalizeKey)(order.product?.color), SOURCE_WEIGHTS.order);
            interactionPrices.push(order.total_amount);
            if (order.product?.price) {
                interactionPrices.push(order.product.price);
            }
        });
        tryOnResults.forEach((result)=>{
            addProductInteraction(productInteractions, result.product, 'try_on', result.created_at);
            recentInteractions.push({
                product: result.product,
                weight: SOURCE_WEIGHTS.try_on
            });
            incrementCount(brandCounts, resolveBrandKey(result.product), SOURCE_WEIGHTS.try_on);
            incrementCount(categoryCounts, result.product?.category_id, SOURCE_WEIGHTS.try_on);
            incrementCount(productTypeCounts, resolveProductTypeKey(result.product), SOURCE_WEIGHTS.try_on);
        });
        virtualTryOnResults.forEach((result)=>{
            const product = result.selected_products?.[0] || null;
            addProductInteraction(productInteractions, product, 'virtual_try_on', result.created_at);
            recentInteractions.push({
                product,
                weight: SOURCE_WEIGHTS.virtual_try_on,
                source: 'virtual_try_on'
            });
            if (product) {
                incrementCount(brandCounts, resolveBrandKey(product), SOURCE_WEIGHTS.virtual_try_on);
                incrementCount(categoryCounts, product?.category_id, SOURCE_WEIGHTS.virtual_try_on);
                incrementCount(productTypeCounts, resolveProductTypeKey(product), SOURCE_WEIGHTS.virtual_try_on);
            }
        });
        savedOutfits.forEach((outfit)=>{
            const products = Array.isArray(outfit.products) ? outfit.products : Array.isArray(outfit.items) ? outfit.items : [];
            products.slice(0, 3).forEach((product)=>{
                addProductInteraction(productInteractions, product, 'saved_look', outfit.created_at);
                recentInteractions.push({
                    product,
                    weight: SOURCE_WEIGHTS.saved_look,
                    source: 'saved_look'
                });
            });
            if (!products.length) {
                recentInteractions.push({
                    product: null,
                    weight: SOURCE_WEIGHTS.saved_look,
                    source: 'saved_look'
                });
            }
        });
        favoriteBrands.forEach((brand)=>{
            incrementCount(brandCounts, (0, _fashiondnaproductstyleutil.normalizeKey)(brand.brand_name), Math.max(1, brand.interaction_count || 1));
        });
        const onboardingBrands = Array.isArray(preferences.favorite_brands) ? preferences.favorite_brands : [];
        onboardingBrands.forEach((brand)=>{
            incrementCount(brandCounts, (0, _fashiondnaproductstyleutil.normalizeKey)(brand), SOURCE_WEIGHTS.onboarding_brand);
        });
        const onboardingColors = Array.isArray(preferences.favorite_colors) ? preferences.favorite_colors : [];
        onboardingColors.forEach((color)=>{
            incrementCount(colorCounts, (0, _fashiondnaproductstyleutil.normalizeKey)(color), SOURCE_WEIGHTS.onboarding_color);
        });
        favoriteColors.forEach((color)=>{
            incrementCount(colorCounts, (0, _fashiondnaproductstyleutil.normalizeKey)(color.color_name), Math.max(1, Math.round(color.usage_percent || 1)));
        });
        const cartPrices = cartItems.map((item)=>Number(item.product?.price)).filter((price)=>price > 0);
        const cartAveragePrice = cartPrices.length ? cartPrices.reduce((sum, price)=>sum + price, 0) / cartPrices.length : null;
        const totalSpent = orders.reduce((sum, order)=>sum + order.total_amount, 0);
        const averageSpending = orders.length ? Number((totalSpent / orders.length).toFixed(2)) : null;
        const searchBehaviour = buildSearchBehaviour(searchHistory);
        const discountPreference = buildDiscountPreference(orders, productInteractions);
        const recentlyInfluenced = buildRecentlyInfluenced(recentInteractions);
        const activityVolume = {
            orders: orders.length,
            wishlist: wishlistItems.length,
            cart: cartItems.length,
            closet: closetItems.length,
            product_views: productViews.length,
            searches: searchHistory.length,
            try_on: tryOnResults.length,
            virtual_try_on: virtualTryOnResults.length,
            saved_looks: savedOutfits.length,
            stylist_sessions: stylistSessions
        };
        const shoppingInfluence = buildShoppingInfluence({
            activityVolume,
            favoriteCategories: normalizeAffinity(categoryCounts),
            favoriteBrandsRanked: rankTopBrandAffinity(brandCounts),
            priceAffinity: computePriceAffinity(interactionPrices),
            averageSpending,
            cartAveragePrice
        });
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
                ...favoriteColors.map((entry)=>entry.color_name)
            ],
            averageSpending,
            cartAveragePrice,
            priceAffinity: computePriceAffinity(interactionPrices),
            searchTerms: searchBehaviour.searchTerms,
            searchBehaviour,
            discountPreference,
            recentlyInfluenced,
            shoppingInfluence,
            productInteractions,
            recentInteractions,
            baselineInteractions,
            activityVolume
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
            search_behaviour: signals.searchBehaviour,
            discount_preference: signals.discountPreference,
            recently_influenced: signals.recentlyInfluenced,
            shopping_influence: signals.shoppingInfluence,
            activity_volume: signals.activityVolume,
            color_counts: signals.colorCounts
        };
    }
};
FashionDnaBehavioralService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _common.Inject)(_fashiondnaactivityrepository.FashionDnaActivityRepository)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        void 0
    ])
], FashionDnaBehavioralService);

//# sourceMappingURL=fashion-dna-behavioral.service.js.map