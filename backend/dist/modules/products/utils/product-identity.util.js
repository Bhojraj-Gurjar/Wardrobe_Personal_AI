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
    get assertSkuIsImmutable () {
        return assertSkuIsImmutable;
    },
    get isCatalogSku () {
        return isCatalogSku;
    },
    get resolveProductReference () {
        return resolveProductReference;
    },
    get resolveStableProductId () {
        return resolveStableProductId;
    }
});
const _nodecrypto = require("node:crypto");
const _productidentityconstants = require("../constants/product-identity.constants");
function toUuidFromHash(hashHex) {
    const variant = (parseInt(hashHex.slice(16, 18), 16) & 0x3f | 0x80).toString(16).padStart(2, '0');
    return [
        hashHex.slice(0, 8),
        hashHex.slice(8, 12),
        `4${hashHex.slice(13, 16)}`,
        `${variant}${hashHex.slice(18, 20)}`,
        hashHex.slice(20, 32)
    ].join('-');
}
function resolveStableProductId(sku) {
    const hash = (0, _nodecrypto.createHash)('sha256').update(`${_productidentityconstants.CATALOG_ID_NAMESPACE_SEED}:${sku}`).digest('hex');
    return toUuidFromHash(hash);
}
function isCatalogSku(sku) {
    return typeof sku === 'string' && sku.startsWith(_productidentityconstants.CATALOG_SKU_PREFIX);
}
function assertSkuIsImmutable(existingSku, nextSku) {
    if (nextSku !== undefined && nextSku !== existingSku) {
        throw new Error('SKU is immutable after product creation');
    }
}
function resolveProductReference(product) {
    return {
        productId: product.id,
        sku: product.sku
    };
}

//# sourceMappingURL=product-identity.util.js.map