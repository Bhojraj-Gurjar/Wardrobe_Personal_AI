/**
 * Digital avatar wear-layer contract.
 * Lower overlayOrder renders behind higher overlayOrder.
 */

export const AVATAR_CATEGORIES = [
  'TOP',
  'JACKET',
  'BOTTOM',
  'FOOTWEAR',
  'ACCESSORY',
];

/** Default z-index base per avatar slot (back → front). */
export const AVATAR_CATEGORY_OVERLAY_ORDER = {
  BOTTOM: 10,
  FOOTWEAR: 20,
  TOP: 30,
  JACKET: 40,
  ACCESSORY: 50,
};

/** Subcategory overrides for accessories that sit between body layers. */
export const SUBCATEGORY_AVATAR_OVERLAY_ORDER = {
  belts: 25,
};

/** Maps catalog subcategory slugs to avatar wear slots. */
export const SUBCATEGORY_AVATAR_CATEGORY = {
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
  sandals: 'FOOTWEAR',
};

export function resolveAvatarCategory(subcategory, explicitCategory) {
  if (explicitCategory) {
    return explicitCategory;
  }

  return SUBCATEGORY_AVATAR_CATEGORY[subcategory] ?? null;
}

export function resolveAvatarOverlayOrder(avatarCategory, options = {}) {
  const { subcategory, sequenceIndex = 0 } = options;

  const base = SUBCATEGORY_AVATAR_OVERLAY_ORDER[subcategory]
    ?? AVATAR_CATEGORY_OVERLAY_ORDER[avatarCategory]
    ?? 0;

  return base + sequenceIndex;
}

/**
 * Shape returned by product APIs for the future avatar compositor.
 * Rendering is intentionally out of scope.
 */
export function formatAvatarWearable(product) {
  return {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    productType: product.productType ?? product.product_type ?? null,
    avatarCategory: product.avatarCategory ?? product.avatar_category ?? null,
    overlayOrder: product.overlayOrder ?? product.overlay_order ?? null,
    avatarOverlayUrl: product.avatarOverlayUrl ?? product.avatar_overlay_url ?? null,
    imageUrl: product.imageUrl ?? product.image_url ?? null,
    gender: product.gender ?? null,
  };
}
