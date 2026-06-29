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
    get formatCatalogProduct () {
        return formatCatalogProduct;
    },
    get mapCreateOrUpdateProductData () {
        return mapCreateOrUpdateProductData;
    },
    get resolveCatalogImages () {
        return resolveCatalogImages;
    },
    get resolveLegacyBrandId () {
        return resolveLegacyBrandId;
    },
    get resolveLegacyCategoryId () {
        return resolveLegacyCategoryId;
    },
    get resolveThumbnailUrl () {
        return resolveThumbnailUrl;
    }
});
const _avatarconstants = require("../constants/avatar.constants");
const _producttypeconstants = require("../constants/product-type.constants");
const _productintegrationmapper = require("./product-integration.mapper");
function resolveThumbnailUrl(url, width = 320) {
    if (!url || typeof url !== 'string') {
        return null;
    }
    if (url.includes('images.unsplash.com') || url.includes('images.pexels.com')) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}w=${width}&q=80&auto=format`;
    }
    return url;
}
function deriveCatalogRating(sku = '') {
    let hash = 0;
    for(let index = 0; index < sku.length; index += 1){
        hash = (hash + sku.charCodeAt(index) * (index + 3)) % 1000;
    }
    return Math.round((4.2 + hash % 75 / 100) * 10) / 10;
}
function deriveReviewCount(sku = '') {
    let hash = 0;
    for(let index = 0; index < sku.length; index += 1){
        hash = (hash + sku.charCodeAt(index) * (index + 7)) % 10000;
    }
    return 48 + hash % 420;
}
function resolveLegacyCategoryId(dto, data = {}) {
    if (dto.category !== undefined) {
        return dto.category_id ?? dto.category;
    }
    if (dto.category_id !== undefined) {
        return dto.category_id;
    }
    return data.category_id;
}
function resolveLegacyBrandId(dto, data = {}) {
    if (dto.brand !== undefined) {
        return dto.brand_id ?? dto.brand;
    }
    if (dto.brand_id !== undefined) {
        return dto.brand_id;
    }
    return data.brand_id;
}
function resolveCatalogImages(dto) {
    if (Array.isArray(dto.images) && dto.images.length) {
        return dto.images;
    }
    if (dto.imageUrl) {
        return [
            {
                url: dto.imageUrl,
                sort_order: 0,
                is_primary: true
            }
        ];
    }
    return [];
}
function formatCatalogProduct(product) {
    const images = (product.images || []).map((image)=>({
            id: image.id,
            url: image.url,
            sort_order: image.sort_order,
            is_primary: image.is_primary,
            created_at: image.created_at
        }));
    const primaryImageUrl = product.image_url || images.find((image)=>image.is_primary)?.url || images[0]?.url || null;
    const category = product.category ?? product.category_id ?? null;
    const brand = product.brand ?? product.brand_id ?? null;
    const formatted = {
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description ?? null,
        category,
        subcategory: product.subcategory ?? null,
        productType: product.product_type ?? (0, _producttypeconstants.inferProductType)(product),
        product_type: product.product_type ?? (0, _producttypeconstants.inferProductType)(product),
        gender: product.gender ?? null,
        brand,
        price: product.price,
        currency: product.currency ?? 'INR',
        color: product.color ?? null,
        sizeOptions: product.size_options ?? [],
        fabric: product.fabric ?? null,
        fitType: product.fit_type ?? null,
        styleTags: product.style_tags ?? [],
        occasionTags: product.occasion_tags ?? [],
        imageUrl: primaryImageUrl,
        thumbnailUrl: resolveThumbnailUrl(primaryImageUrl, 320),
        rating: deriveCatalogRating(product.sku),
        reviewCount: deriveReviewCount(product.sku),
        productUrl: product.product_url ?? null,
        avatarCategory: product.avatar_category ?? null,
        overlayOrder: product.overlay_order ?? null,
        avatarOverlayUrl: product.avatar_overlay_url ?? null,
        isActive: product.is_active ?? true,
        visibility: product.visibility ?? 'PUBLISHED',
        stockQuantity: product.stock_quantity ?? 0,
        stock_quantity: product.stock_quantity ?? 0,
        category_id: product.category_id ?? category,
        brand_id: product.brand_id ?? brand,
        variants: (product.variants || []).map((variant)=>({
                id: variant.id,
                color: variant.color,
                size: variant.size,
                stock: variant.stock ?? 0,
                sku: variant.sku,
                imageUrl: variant.image_url ?? null
            })),
        images,
        createdAt: product.created_at,
        updatedAt: product.updated_at,
        created_at: product.created_at,
        updated_at: product.updated_at
    };
    return {
        ...formatted,
        avatarWearable: (0, _avatarconstants.formatAvatarWearable)(formatted),
        integration: (0, _productintegrationmapper.formatProductIntegrationProfile)(product)
    };
}
function mapCreateOrUpdateProductData(dto, options = {}) {
    const { allowSku = true } = options;
    const data = {};
    if (allowSku && dto.sku !== undefined) data.sku = dto.sku;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.category !== undefined) {
        data.category = dto.category;
        data.category_id = resolveLegacyCategoryId(dto);
    } else if (dto.category_id !== undefined) {
        data.category_id = dto.category_id;
        data.category = dto.category_id;
    }
    if (dto.brand !== undefined) {
        data.brand = dto.brand;
        data.brand_id = resolveLegacyBrandId(dto);
    } else if (dto.brand_id !== undefined) {
        data.brand_id = dto.brand_id;
        data.brand = dto.brand_id;
    }
    if (dto.subcategory !== undefined) data.subcategory = dto.subcategory;
    if (dto.productType !== undefined) {
        data.product_type = dto.productType;
    }
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.sizeOptions !== undefined) data.size_options = dto.sizeOptions;
    if (dto.fabric !== undefined) data.fabric = dto.fabric;
    if (dto.fitType !== undefined) data.fit_type = dto.fitType;
    if (dto.styleTags !== undefined) data.style_tags = dto.styleTags;
    if (dto.occasionTags !== undefined) data.occasion_tags = dto.occasionTags;
    if (dto.imageUrl !== undefined) data.image_url = dto.imageUrl;
    if (dto.productUrl !== undefined) data.product_url = dto.productUrl;
    if (dto.avatarCategory !== undefined) {
        data.avatar_category = dto.avatarCategory;
        if (dto.overlayOrder === undefined) {
            data.overlay_order = (0, _avatarconstants.resolveAvatarOverlayOrder)(dto.avatarCategory, {
                subcategory: dto.subcategory
            });
        }
    } else if (dto.productType !== undefined) {
        const resolvedAvatar = (0, _producttypeconstants.resolveAvatarCategoryFromProductType)(dto.productType);
        if (resolvedAvatar) {
            data.avatar_category = resolvedAvatar;
            if (dto.overlayOrder === undefined) {
                data.overlay_order = (0, _avatarconstants.resolveAvatarOverlayOrder)(resolvedAvatar, {
                    subcategory: dto.subcategory
                });
            }
        }
    }
    if (dto.overlayOrder !== undefined) data.overlay_order = dto.overlayOrder;
    if (dto.avatarOverlayUrl !== undefined) data.avatar_overlay_url = dto.avatarOverlayUrl;
    if (dto.isActive !== undefined) data.is_active = dto.isActive;
    return data;
}

//# sourceMappingURL=product-catalog.mapper.js.map