"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get buildFactorsSummary () {
        return buildFactorsSummary;
    },
    get buildUserSignals () {
        return buildUserSignals;
    },
    get scoreProduct () {
        return scoreProduct;
    }
});
const _recommendationconstants = require("../validators/recommendation.constants");
function topAffinityKeys(affinityMap, limit = 5) {
    if (!affinityMap || typeof affinityMap !== 'object') {
        return [];
    }
    return Object.entries(affinityMap).sort(([, left], [, right])=>right - left).slice(0, limit).map(([key])=>key);
}
function buildUserSignals({ profile, fashionDna, wishlistItems, orders }) {
    const wishlistProductIds = wishlistItems.map((item)=>item.product_id);
    const wishlistBrands = [
        ...new Set(wishlistItems.map((item)=>item.product?.brand_id).filter(Boolean))
    ];
    const wishlistCategories = [
        ...new Set(wishlistItems.map((item)=>item.product?.category_id).filter(Boolean))
    ];
    const dnaBrands = topAffinityKeys(fashionDna?.brand_affinity, 8).filter((brand)=>brand !== 'undiscovered');
    const favoriteBrands = [
        ...new Set([
            ...dnaBrands,
            ...wishlistBrands
        ])
    ];
    const favoriteColors = topAffinityKeys(fashionDna?.color_affinity, 6);
    const orderCount = orders.length;
    const totalSpent = orders.reduce((sum, order)=>sum + order.total_amount, 0);
    const avgOrderValue = orderCount ? totalSpent / orderCount : 0;
    return {
        profile,
        fashionDna,
        wishlistProductIds,
        wishlistBrands,
        wishlistCategories,
        favoriteBrands,
        favoriteColors,
        orderStats: {
            count: orderCount,
            totalSpent,
            avgOrderValue
        }
    };
}
function buildFactorsSummary(signals) {
    return {
        body_type: signals.profile?.body_type || null,
        skin_tone: signals.profile?.skin_tone || null,
        favorite_brands: signals.favoriteBrands,
        favorite_colors: signals.favoriteColors,
        shopping_history: {
            order_count: signals.orderStats.count,
            total_spent: signals.orderStats.totalSpent,
            avg_order_value: signals.orderStats.avgOrderValue
        },
        wishlist: {
            item_count: signals.wishlistProductIds.length,
            brands: signals.wishlistBrands,
            categories: signals.wishlistCategories
        }
    };
}
function scoreProduct(product, signals) {
    let score = 0;
    const matchedFactors = [];
    if (signals.profile?.body_type && signals.fashionDna?.style_score !== undefined) {
        score += signals.fashionDna.style_score * 0.1;
        matchedFactors.push(_recommendationconstants.RECOMMENDATION_FACTORS.BODY_TYPE);
    }
    if (signals.profile?.skin_tone && signals.favoriteColors.length) {
        score += 12;
        matchedFactors.push(_recommendationconstants.RECOMMENDATION_FACTORS.SKIN_TONE);
    }
    if (signals.favoriteBrands.includes(product.brand_id)) {
        score += 30;
        matchedFactors.push(_recommendationconstants.RECOMMENDATION_FACTORS.FAVORITE_BRANDS);
    }
    if (signals.favoriteColors.length) {
        score += 10;
        matchedFactors.push(_recommendationconstants.RECOMMENDATION_FACTORS.FAVORITE_COLORS);
    }
    if (signals.wishlistCategories.includes(product.category_id)) {
        score += 20;
        matchedFactors.push(_recommendationconstants.RECOMMENDATION_FACTORS.WISHLIST);
    }
    if (signals.orderStats.avgOrderValue > 0) {
        const priceDelta = Math.abs(product.price - signals.orderStats.avgOrderValue);
        if (priceDelta <= signals.orderStats.avgOrderValue * 0.35) {
            score += 18;
            matchedFactors.push(_recommendationconstants.RECOMMENDATION_FACTORS.SHOPPING_HISTORY);
        }
    }
    return {
        score: Number(score.toFixed(2)),
        matchedFactors: [
            ...new Set(matchedFactors)
        ]
    };
}

//# sourceMappingURL=user-context.builder.js.map