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
    get DEFAULT_PAGE () {
        return DEFAULT_PAGE;
    },
    get MAX_LIMIT () {
        return MAX_LIMIT;
    },
    get PRODUCT_SORT_FIELDS () {
        return PRODUCT_SORT_FIELDS;
    },
    get SORT_ORDERS () {
        return SORT_ORDERS;
    }
});
const PRODUCT_SORT_FIELDS = [
    'name',
    'price',
    'sku',
    'created_at',
    'updated_at',
    'category',
    'brand'
];
const SORT_ORDERS = [
    'asc',
    'desc'
];
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

//# sourceMappingURL=product.constants.js.map