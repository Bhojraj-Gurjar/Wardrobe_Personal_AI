/**
 * Stable catalog identity contract.
 * SKU is the immutable business key; product UUID is derived once and never rotated.
 */ "use strict";
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
    get CATALOG_ID_NAMESPACE_SEED () {
        return CATALOG_ID_NAMESPACE_SEED;
    },
    get CATALOG_SKU_PREFIX () {
        return CATALOG_SKU_PREFIX;
    },
    get PRODUCT_INTEGRATION_TARGETS () {
        return PRODUCT_INTEGRATION_TARGETS;
    },
    get PRODUCT_REFERENCE_FIELDS () {
        return PRODUCT_REFERENCE_FIELDS;
    }
});
const CATALOG_ID_NAMESPACE_SEED = 'wardrobe-ai:catalog:v1';
const CATALOG_SKU_PREFIX = 'WA-';
const PRODUCT_REFERENCE_FIELDS = [
    'id',
    'sku'
];
const PRODUCT_INTEGRATION_TARGETS = [
    'fashionDna',
    'digitalAvatar',
    'recommendation',
    'virtualTryOn'
];

//# sourceMappingURL=product-identity.constants.js.map