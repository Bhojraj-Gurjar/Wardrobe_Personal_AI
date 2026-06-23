"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "normalizeProductQuery", {
    enumerable: true,
    get: function() {
        return normalizeProductQuery;
    }
});
function normalizeProductQuery(query = {}) {
    const normalized = {
        ...query
    };
    if (normalized.minPrice !== undefined && normalized.min_price === undefined) {
        normalized.min_price = normalized.minPrice;
    }
    if (normalized.maxPrice !== undefined && normalized.max_price === undefined) {
        normalized.max_price = normalized.maxPrice;
    }
    if (normalized.q !== undefined && normalized.search === undefined) {
        normalized.search = normalized.q;
    }
    return normalized;
}

//# sourceMappingURL=normalize-product-query.util.js.map