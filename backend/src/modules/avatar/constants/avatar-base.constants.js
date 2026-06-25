export const AVATAR_BASE_PATHS = {
  slim: '/avatar/base/slim.png',
  athletic: '/avatar/base/athletic.png',
  average: '/avatar/base/average.png',
  muscular: '/avatar/base/muscular.png',
  'plus-size': '/avatar/base/plus-size.png',
  plus_size: '/avatar/base/plus-size.png',
  curvy: '/avatar/base/average.png',
};

/** Canonical body-type → base silhouette mapping. */
export const BODY_TYPE_SILHOUETTE_MAP = {
  slim: AVATAR_BASE_PATHS.slim,
  athletic: AVATAR_BASE_PATHS.athletic,
  average: AVATAR_BASE_PATHS.average,
  muscular: AVATAR_BASE_PATHS.muscular,
  'plus-size': AVATAR_BASE_PATHS['plus-size'],
  plus_size: AVATAR_BASE_PATHS['plus-size'],
};

export const DEFAULT_AVATAR_BASE_PATH = AVATAR_BASE_PATHS.athletic;

export const AVATAR_OVERLAY_DEFAULTS = {
  't-shirts': '/avatar/tshirts/default.png',
  shirts: '/avatar/shirts/default.png',
  jackets: '/avatar/jackets/default.png',
  pants: '/avatar/pants/default.png',
  shoes: '/avatar/shoes/default.png',
};

export function normalizeBodyTypeKey(bodyType) {
  if (!bodyType) {
    return null;
  }

  return String(bodyType)
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-');
}

export function resolveBaseAvatarUrl(bodyType) {
  const key = normalizeBodyTypeKey(bodyType);

  if (key && BODY_TYPE_SILHOUETTE_MAP[key]) {
    return BODY_TYPE_SILHOUETTE_MAP[key];
  }

  if (key && AVATAR_BASE_PATHS[key]) {
    return AVATAR_BASE_PATHS[key];
  }

  if (key?.includes('plus')) {
    return AVATAR_BASE_PATHS['plus-size'];
  }

  if (key?.includes('slim') || key?.includes('lean')) {
    return AVATAR_BASE_PATHS.slim;
  }

  if (key?.includes('muscle')) {
    return AVATAR_BASE_PATHS.muscular;
  }

  if (key?.includes('athlet')) {
    return AVATAR_BASE_PATHS.athletic;
  }

  if (key?.includes('averag')) {
    return AVATAR_BASE_PATHS.average;
  }

  return DEFAULT_AVATAR_BASE_PATH;
}

export function normalizeSkinTone(skinTone) {
  if (!skinTone) {
    return null;
  }

  return String(skinTone).trim().toLowerCase().replace(/\s+/g, '-');
}

export function normalizeHairColor(hairColor) {
  if (!hairColor) {
    return null;
  }

  return String(hairColor).trim().toLowerCase().replace(/\s+/g, '-');
}
