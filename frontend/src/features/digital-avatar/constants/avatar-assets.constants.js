export const AVATAR_BASE_PATHS = {
  slim: '/avatar/base/slim.png',
  athletic: '/avatar/base/athletic.png',
  average: '/avatar/base/average.png',
  muscular: '/avatar/base/muscular.png',
  'plus-size': '/avatar/base/plus-size.png',
};

export const AVATAR_OVERLAY_DEFAULTS = {
  't-shirts': '/avatar/tshirts/placeholder.png',
  shirts: '/avatar/shirts/placeholder.png',
  jackets: '/avatar/jackets/placeholder.png',
  pants: '/avatar/pants/placeholder.png',
  shoes: '/avatar/shoes/placeholder.png',
};

/** SVG sources — swap PNG paths above when real transparent assets are ready. */
export const AVATAR_OVERLAY_PLACEHOLDER_SVGS = {
  't-shirts': '/avatar/tshirts/placeholder.svg',
  shirts: '/avatar/shirts/placeholder.svg',
  jackets: '/avatar/jackets/placeholder.svg',
  pants: '/avatar/pants/placeholder.svg',
  shoes: '/avatar/shoes/placeholder.svg',
};

export const AVATAR_LAYER_SIZE = {
  width: 280,
  height: 520,
};

export function resolveProductOverlayUrl(product, categoryId) {
  const overlay =
    product?.avatarOverlayUrl
    || product?.avatar_overlay_url
    || product?.avatarWearable?.avatarOverlayUrl
    || null;

  if (overlay) {
    return encodeAvatarAssetUrl(overlay);
  }

  const fallback = AVATAR_OVERLAY_DEFAULTS[categoryId] || null;

  return fallback ? encodeAvatarAssetUrl(fallback) : null;
}

export function encodeAvatarAssetUrl(path) {
  if (!path || !path.startsWith('/')) {
    return path;
  }

  return path
    .split('/')
    .map((segment, index) => (index === 0 ? '' : encodeURIComponent(segment)))
    .join('/');
}
