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
function normalizeTagList(tags) {
    if (Array.isArray(tags)) {
        return tags.filter(Boolean).map((tag)=>String(tag));
    }
    if (tags && typeof tags === 'object') {
        return Object.values(tags).filter(Boolean).map((tag)=>String(tag));
    }
    if (tags != null && tags !== '') {
        return [
            String(tags)
        ];
    }
    return [];
}
function resolveProductStyleTags(product) {
    return [
        ...normalizeTagList(product?.style_tags),
        ...normalizeTagList(product?.styleTags)
    ];
}
function topAffinityKeys(affinityMap, limit = 5) {
    if (!affinityMap || typeof affinityMap !== 'object') {
        return [];
    }
    return Object.entries(affinityMap).sort(([, left], [, right])=>right - left).slice(0, limit).map(([key])=>key);
}
function resolveProductBrand(product) {
    return product.brand ?? product.brand_id ?? null;
}
function resolveProductCategory(product) {
    return product.category ?? product.category_id ?? product.subcategory ?? null;
}
function buildUserSignals({ profile, fashionDna, wishlistItems, orders, searchHistory = [], productViews = [] }) {
    const wishlistProductIds = wishlistItems.map((item)=>item.product_id);
    const wishlistBrands = [
        ...new Set(wishlistItems.map((item)=>resolveProductBrand(item.product)).filter(Boolean))
    ];
    const wishlistCategories = [
        ...new Set(wishlistItems.map((item)=>resolveProductCategory(item.product)).filter(Boolean))
    ];
    const activityBrands = topAffinityKeys(fashionDna?.activity_traits?.favorite_brands, 8);
    const dnaBrands = topAffinityKeys(fashionDna?.brand_affinity, 8).filter((brand)=>brand !== 'undiscovered');
    const favoriteBrands = [
        ...new Set([
            ...activityBrands,
            ...dnaBrands,
            ...wishlistBrands
        ])
    ];
    const favoriteColors = topAffinityKeys(fashionDna?.color_affinity, 6);
    const favoriteCategories = topAffinityKeys(fashionDna?.activity_traits?.favorite_categories, 6);
    const orderCount = orders.length;
    const totalSpent = orders.reduce((sum, order)=>sum + order.total_amount, 0);
    const activityAverageSpending = fashionDna?.activity_traits?.average_spending;
    const avgOrderValue = activityAverageSpending ?? (orderCount ? totalSpent / orderCount : 0);
    const searchTerms = [
        ...Object.keys(fashionDna?.activity_traits?.search_terms || {}),
        ...searchHistory.map((entry)=>String(entry.query || '').trim().toLowerCase()).filter(Boolean)
    ];
    const uniqueSearchTerms = [
        ...new Set(searchTerms)
    ].slice(0, 12);
    const viewedCategories = [
        ...new Set(productViews.map((view)=>resolveProductCategory(view.product)).filter(Boolean))
    ];
    const viewedBrands = [
        ...new Set(productViews.map((view)=>resolveProductBrand(view.product)).filter(Boolean))
    ];
    return {
        profile,
        fashionDna,
        wishlistProductIds,
        wishlistBrands,
        wishlistCategories,
        favoriteBrands: [
            ...new Set([
                ...favoriteBrands,
                ...viewedBrands
            ])
        ],
        favoriteColors,
        favoriteCategories: [
            ...new Set([
                ...favoriteCategories,
                ...viewedCategories
            ])
        ],
        searchTerms: uniqueSearchTerms,
        viewedProductIds: productViews.map((view)=>view.product_id).filter(Boolean),
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
    if (signals.profile?.body_type && signals.fashionDna?.fashion_confidence_score !== undefined) {
        score += signals.fashionDna.fashion_confidence_score * 0.1;
        matchedFactors.push(_recommendationconstants.RECOMMENDATION_FACTORS.BODY_TYPE);
    }
    if (signals.profile?.skin_tone && signals.favoriteColors.length) {
        score += 12;
        matchedFactors.push(_recommendationconstants.RECOMMENDATION_FACTORS.SKIN_TONE);
    }
    const productBrand = resolveProductBrand(product);
    const productCategory = resolveProductCategory(product);
    if (productBrand && signals.favoriteBrands.includes(productBrand)) {
        score += 30;
        matchedFactors.push(_recommendationconstants.RECOMMENDATION_FACTORS.FAVORITE_BRANDS);
    }
    if (signals.favoriteColors.length) {
        score += 10;
        matchedFactors.push(_recommendationconstants.RECOMMENDATION_FACTORS.FAVORITE_COLORS);
    }
    if (productCategory && signals.favoriteCategories?.includes(productCategory) || productCategory && signals.wishlistCategories.includes(productCategory)) {
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
    if (signals.searchTerms?.length) {
        const haystack = [
            product.name,
            product.brand,
            product.brand_id,
            product.category,
            product.category_id,
            product.subcategory,
            product.product_type,
            product.productType,
            ...resolveProductStyleTags(product)
        ].filter(Boolean).join(' ').toLowerCase();
        const matchedSearch = signals.searchTerms.some((term)=>term.length >= 3 && haystack.includes(term));
        if (matchedSearch) {
            score += 22;
            matchedFactors.push(_recommendationconstants.RECOMMENDATION_FACTORS.SEARCH_HISTORY);
        }
    }
    if (signals.viewedProductIds?.includes(product.id)) {
        score -= 8;
    }
    return {
        score: Number(score.toFixed(2)),
        matchedFactors: [
            ...new Set(matchedFactors)
        ]
    };
}

//# sourceMappingURL=user-context.builder.js.map