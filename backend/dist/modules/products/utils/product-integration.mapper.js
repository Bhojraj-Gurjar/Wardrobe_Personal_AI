"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "formatProductIntegrationProfile", {
    enumerable: true,
    get: function() {
        return formatProductIntegrationProfile;
    }
});
const _avatarconstants = require("../constants/avatar.constants");
const _productidentityutil = require("./product-identity.util");
function formatProductIntegrationProfile(product) {
    const category = product.category ?? product.category_id ?? null;
    const brand = product.brand ?? product.brand_id ?? null;
    const imageUrl = product.image_url ?? product.images?.find((image)=>image.is_primary)?.url ?? product.images?.[0]?.url ?? null;
    const refs = (0, _productidentityutil.resolveProductReference)(product);
    const avatarWearable = (0, _avatarconstants.formatAvatarWearable)({
        ...product,
        imageUrl,
        avatarCategory: product.avatar_category,
        overlayOrder: product.overlay_order,
        avatarOverlayUrl: product.avatar_overlay_url
    });
    return {
        refs,
        fashionDna: {
            productId: refs.productId,
            sku: refs.sku,
            brand,
            color: product.color ?? null,
            category,
            subcategory: product.subcategory ?? null,
            styleTags: product.style_tags ?? [],
            occasionTags: product.occasion_tags ?? [],
            price: product.price,
            fitType: product.fit_type ?? null,
            fabric: product.fabric ?? null,
            gender: product.gender ?? null
        },
        digitalAvatar: avatarWearable,
        recommendation: {
            productId: refs.productId,
            sku: refs.sku,
            brand,
            category,
            subcategory: product.subcategory ?? null,
            styleTags: product.style_tags ?? [],
            occasionTags: product.occasion_tags ?? [],
            price: product.price,
            gender: product.gender ?? null
        },
        virtualTryOn: {
            productId: refs.productId,
            sku: refs.sku,
            imageUrl,
            avatarOverlayUrl: product.avatar_overlay_url ?? null,
            avatarCategory: product.avatar_category ?? null,
            overlayOrder: product.overlay_order ?? null,
            fitType: product.fit_type ?? null,
            gender: product.gender ?? null,
            sizeOptions: product.size_options ?? [],
            color: product.color ?? null,
            fabric: product.fabric ?? null
        }
    };
}

//# sourceMappingURL=product-integration.mapper.js.map