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
    get DEFAULT_LIMIT () {
        return DEFAULT_LIMIT;
    },
    get MAX_LIMIT () {
        return MAX_LIMIT;
    },
    get RECOMMENDATION_FACTORS () {
        return RECOMMENDATION_FACTORS;
    },
    get RECOMMENDATION_SOURCES () {
        return RECOMMENDATION_SOURCES;
    }
});
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const RECOMMENDATION_SOURCES = {
    QDRANT: 'qdrant',
    POSTGRESQL: 'postgresql'
};
const RECOMMENDATION_FACTORS = {
    BODY_TYPE: 'body_type',
    SKIN_TONE: 'skin_tone',
    FAVORITE_BRANDS: 'favorite_brands',
    FAVORITE_COLORS: 'favorite_colors',
    SHOPPING_HISTORY: 'shopping_history',
    WISHLIST: 'wishlist'
};

//# sourceMappingURL=recommendation.constants.js.map