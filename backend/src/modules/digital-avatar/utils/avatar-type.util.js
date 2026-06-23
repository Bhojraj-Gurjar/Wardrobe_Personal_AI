import {
  AvatarRenderMode,
  AVATAR_RENDER_MODES,
  DEFAULT_AVATAR_TYPE,
  LEGACY_AVATAR_TYPE_ALIASES,
  LEGACY_PROCEDURAL_AVATAR_TYPES,
} from '../constants/digital-avatar.constants';

export const AvatarTraitRequirement = {
  BASIC: 'basic',
  PREMIUM: 'premium',
  DIGITAL_TWIN: 'digital_twin',
};

/**
 * Output and pipeline capabilities per render mode.
 * Extend here when 3D generation is implemented (glb/usdz paths, mesh metadata).
 */
export const AVATAR_RENDER_CAPABILITIES = {
  [AvatarRenderMode.BASIC_2D]: {
    dimension: '2d',
    outputFormat: 'png',
    storageKind: 'image',
    implemented: true,
    traitRequirement: AvatarTraitRequirement.BASIC,
    aiRouteKey: 'BASIC',
  },
  [AvatarRenderMode.PREMIUM_PHOTOREALISTIC]: {
    dimension: '2d',
    outputFormat: 'png',
    storageKind: 'image',
    implemented: true,
    traitRequirement: AvatarTraitRequirement.PREMIUM,
    aiRouteKey: 'PREMIUM',
  },
  [AvatarRenderMode.DIGITAL_TWIN_3D]: {
    dimension: '3d',
    outputFormat: 'glb',
    storageKind: 'mesh',
    implemented: false,
    traitRequirement: AvatarTraitRequirement.DIGITAL_TWIN,
    aiRouteKey: 'DIGITAL_TWIN_3D',
  },
};

export function normalizeAvatarType(avatarType = DEFAULT_AVATAR_TYPE) {
  const normalized = String(avatarType || DEFAULT_AVATAR_TYPE)
    .trim()
    .toUpperCase();

  return LEGACY_AVATAR_TYPE_ALIASES[normalized] || normalized;
}

export function isCanonicalRenderMode(avatarType) {
  return AVATAR_RENDER_MODES.includes(normalizeAvatarType(avatarType));
}

export function isLegacyProceduralAvatarType(avatarType) {
  return LEGACY_PROCEDURAL_AVATAR_TYPES.includes(
    String(avatarType || '').trim().toUpperCase(),
  );
}

export function getAvatarRenderCapabilities(avatarType) {
  const canonical = normalizeAvatarType(avatarType);

  if (AVATAR_RENDER_CAPABILITIES[canonical]) {
    return AVATAR_RENDER_CAPABILITIES[canonical];
  }

  if (isLegacyProceduralAvatarType(avatarType)) {
    return {
      dimension: '2d',
      outputFormat: 'png',
      storageKind: 'image',
      implemented: true,
      traitRequirement: AvatarTraitRequirement.BASIC,
      aiRouteKey: String(avatarType).trim().toUpperCase(),
    };
  }

  return null;
}

export function resolveAiAvatarType(avatarType) {
  const capabilities = getAvatarRenderCapabilities(avatarType);

  if (capabilities?.aiRouteKey) {
    return capabilities.aiRouteKey;
  }

  return normalizeAvatarType(avatarType);
}

export function isAvatarTypeImplemented(avatarType) {
  const capabilities = getAvatarRenderCapabilities(avatarType);

  if (!capabilities) {
    return false;
  }

  return capabilities.implemented;
}

export function getAvatarTraitRequirement(avatarType) {
  const capabilities = getAvatarRenderCapabilities(avatarType);

  return capabilities?.traitRequirement || AvatarTraitRequirement.BASIC;
}
