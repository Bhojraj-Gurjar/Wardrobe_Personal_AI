/**
 * Digital avatar wear-layer contract.
 * Lower overlayOrder renders behind higher overlayOrder.
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
    get AVATAR_CATEGORIES () {
        return AVATAR_CATEGORIES;
    },
    get AVATAR_CATEGORY_OVERLAY_ORDER () {
        return AVATAR_CATEGORY_OVERLAY_ORDER;
    },
    get SUBCATEGORY_AVATAR_CATEGORY () {
        return SUBCATEGORY_AVATAR_CATEGORY;
    },
    get SUBCATEGORY_AVATAR_OVERLAY_ORDER () {
        return SUBCATEGORY_AVATAR_OVERLAY_ORDER;
    },
    get formatAvatarWearable () {
        return formatAvatarWearable;
    },
    get resolveAvatarCategory () {
        return resolveAvatarCategory;
    },
    get resolveAvatarOverlayOrder () {
        return resolveAvatarOverlayOrder;
    }
});
const AVATAR_CATEGORIES = [
    'TOP',
    'JACKET',
    'BOTTOM',
    'FOOTWEAR',
    'ACCESSORY'
];
const AVATAR_CATEGORY_OVERLAY_ORDER = {
    BOTTOM: 10,
    FOOTWEAR: 20,
    TOP: 30,
    JACKET: 40,
    ACCESSORY: 50
};
const SUBCATEGORY_AVATAR_OVERLAY_ORDER = {
    belts: 25
};
const SUBCATEGORY_AVATAR_CATEGORY = {
    'men-t-shirts': 'TOP',
    'men-shirts': 'TOP',
    'men-jackets': 'JACKET',
    'men-jeans': 'BOTTOM',
    'men-trousers': 'BOTTOM',
    'men-suits': 'TOP',
    watches: 'ACCESSORY',
    sunglasses: 'ACCESSORY',
    bags: 'ACCESSORY',
    belts: 'ACCESSORY',
    shoes: 'FOOTWEAR',
    sneakers: 'FOOTWEAR',
    sandals: 'FOOTWEAR'
};
function resolveAvatarCategory(subcategory, explicitCategory) {
    if (explicitCategory) {
        return explicitCategory;
    }
    return SUBCATEGORY_AVATAR_CATEGORY[subcategory] ?? null;
}
function resolveAvatarOverlayOrder(avatarCategory, options = {}) {
    const { subcategory, sequenceIndex = 0 } = options;
    const base = SUBCATEGORY_AVATAR_OVERLAY_ORDER[subcategory] ?? AVATAR_CATEGORY_OVERLAY_ORDER[avatarCategory] ?? 0;
    return base + sequenceIndex;
}
function formatAvatarWearable(product) {
    return {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        productType: product.productType ?? product.product_type ?? null,
        avatarCategory: product.avatarCategory ?? product.avatar_category ?? null,
        overlayOrder: product.overlayOrder ?? product.overlay_order ?? null,
        avatarOverlayUrl: product.avatarOverlayUrl ?? product.avatar_overlay_url ?? null,
        imageUrl: product.imageUrl ?? product.image_url ?? null,
        gender: product.gender ?? null
    };
}

//# sourceMappingURL=avatar.constants.js.map