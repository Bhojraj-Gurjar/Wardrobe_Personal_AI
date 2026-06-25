/**
 * Avatar overlay URL resolution for catalog products.
 * Maps wearable subcategories to transparent PNG layers served from /avatar/.
 */

export const AVATAR_TAB_OVERLAY_DEFAULTS = {
  't-shirts': '/avatar/tshirts/placeholder.png',
  shirts: '/avatar/shirts/placeholder.png',
  jackets: '/avatar/jackets/placeholder.png',
  pants: '/avatar/pants/placeholder.png',
  shoes: '/avatar/shoes/placeholder.png',
};

export const SUBCATEGORY_AVATAR_TAB = {
  'men-t-shirts': 't-shirts',
  'men-shirts': 'shirts',
  'men-jackets': 'jackets',
  'men-jeans': 'pants',
  'men-trousers': 'pants',
  'men-suits': 'shirts',
  shoes: 'shoes',
  sneakers: 'shoes',
  sandals: 'shoes',
};

/** Per-subcategory overrides — replace with real transparent PNGs when available. */
export const SUBCATEGORY_AVATAR_OVERLAY_URLS = {};

export function resolveAvatarTabFromProduct(product = {}) {
  const subcategory = product.subcategory;

  if (subcategory && SUBCATEGORY_AVATAR_TAB[subcategory]) {
    return SUBCATEGORY_AVATAR_TAB[subcategory];
  }

  const avatarCategory = product.avatar_category ?? product.avatarCategory;

  if (avatarCategory === 'TOP') {
    const haystack = `${product.name || ''} ${subcategory || ''}`.toLowerCase();

    if (haystack.includes('shirt') && !haystack.includes('t-shirt') && !haystack.includes('tee')) {
      return 'shirts';
    }

    return 't-shirts';
  }

  if (avatarCategory === 'JACKET') {
    return 'jackets';
  }

  if (avatarCategory === 'BOTTOM') {
    return 'pants';
  }

  if (avatarCategory === 'FOOTWEAR') {
    return 'shoes';
  }

  return null;
}

export function resolveProductAvatarOverlayUrl(product = {}, avatarTab = null) {
  const explicit =
    product.avatar_overlay_url
    ?? product.avatarOverlayUrl
    ?? null;

  if (explicit) {
    return explicit;
  }

  const subcategory = product.subcategory;

  if (subcategory && SUBCATEGORY_AVATAR_OVERLAY_URLS[subcategory]) {
    return SUBCATEGORY_AVATAR_OVERLAY_URLS[subcategory];
  }

  const tab = avatarTab || resolveAvatarTabFromProduct(product);

  if (tab && AVATAR_TAB_OVERLAY_DEFAULTS[tab]) {
    return AVATAR_TAB_OVERLAY_DEFAULTS[tab];
  }

  return null;
}

export function withResolvedAvatarOverlay(product = {}) {
  const avatarTab = resolveAvatarTabFromProduct(product);
  const avatarOverlayUrl = resolveProductAvatarOverlayUrl(product, avatarTab);

  return {
    ...product,
    avatarTab,
    avatarOverlayUrl,
  };
}
