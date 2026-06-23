/**
 * Canonical avatar render modes.
 * Legacy API values (BASIC, PREMIUM) are normalized via avatar-type.util.js.
 */
export const AvatarRenderMode = {
  BASIC_2D: 'BASIC_2D',
  PREMIUM_PHOTOREALISTIC: 'PREMIUM_PHOTOREALISTIC',
  DIGITAL_TWIN_3D: 'DIGITAL_TWIN_3D',
};

export const AVATAR_RENDER_MODES = Object.values(AvatarRenderMode);

/** @deprecated Use AvatarRenderMode.BASIC_2D */
export const BASIC_AVATAR_TYPE = AvatarRenderMode.BASIC_2D;

/** @deprecated Use AvatarRenderMode.PREMIUM_PHOTOREALISTIC */
export const PREMIUM_AVATAR_TYPE = AvatarRenderMode.PREMIUM_PHOTOREALISTIC;

export const DIGITAL_TWIN_3D_AVATAR_TYPE = AvatarRenderMode.DIGITAL_TWIN_3D;

export const DEFAULT_AVATAR_TYPE = AvatarRenderMode.BASIC_2D;

/** Legacy procedural modes kept for backward-compatible AI routing. */
export const LEGACY_PROCEDURAL_AVATAR_TYPES = ['STYLIZED', 'FASHION', 'FITTING'];

/** Accepted API input values (canonical + legacy aliases + procedural). */
export const AVATAR_TYPES = [
  ...AVATAR_RENDER_MODES,
  'BASIC',
  'PREMIUM',
  ...LEGACY_PROCEDURAL_AVATAR_TYPES,
];

export const LEGACY_AVATAR_TYPE_ALIASES = {
  BASIC: AvatarRenderMode.BASIC_2D,
  PREMIUM: AvatarRenderMode.PREMIUM_PHOTOREALISTIC,
};
