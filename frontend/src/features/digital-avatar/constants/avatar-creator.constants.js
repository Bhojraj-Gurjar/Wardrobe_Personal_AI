/**
 * Avatar creator providers.
 *
 * Ready Player Me public services were discontinued (Netflix acquisition, Jan 2026).
 * Default: Avaturn (demo subdomain works without registration).
 * Fallback: native Wardrobe AI creator (face/body/Fashion DNA driven, no external iframe).
 */

export const AVATAR_CREATOR_PROVIDERS = {
  AVATURN: 'avaturn',
  NATIVE: 'native',
};

export const AVATAR_CREATOR_PROVIDER =
  process.env.NEXT_PUBLIC_AVATAR_CREATOR_PROVIDER || AVATAR_CREATOR_PROVIDERS.AVATURN;

export const AVATURN_SUBDOMAIN =
  process.env.NEXT_PUBLIC_AVATURN_SUBDOMAIN || 'demo';

export const AVATURN_BASE_URL = `https://${AVATURN_SUBDOMAIN}.avaturn.dev`;

export const AVATAR_SETUP_GUIDE_URL = 'https://docs.avaturn.me/docs/integration/web/html/';

export const AVATURN_STUDIO_URL = 'https://developer.avaturn.me/';
