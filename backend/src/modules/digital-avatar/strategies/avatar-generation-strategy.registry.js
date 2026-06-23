import { AvatarRenderMode } from '../constants/digital-avatar.constants';
import {
  getAvatarRenderCapabilities,
  normalizeAvatarType,
  resolveAiAvatarType,
} from '../utils/avatar-type.util';

/**
 * Registry mapping canonical render modes to generation strategies.
 * Add new strategies here without changing DigitalAvatarService orchestration.
 */
export const AVATAR_GENERATION_STRATEGIES = {
  [AvatarRenderMode.BASIC_2D]: {
    canonicalType: AvatarRenderMode.BASIC_2D,
    resolveAiType: () => 'BASIC',
  },
  [AvatarRenderMode.PREMIUM_PHOTOREALISTIC]: {
    canonicalType: AvatarRenderMode.PREMIUM_PHOTOREALISTIC,
    resolveAiType: () => 'PREMIUM',
  },
  [AvatarRenderMode.DIGITAL_TWIN_3D]: {
    canonicalType: AvatarRenderMode.DIGITAL_TWIN_3D,
    resolveAiType: () => 'DIGITAL_TWIN_3D',
  },
};

export function resolveAvatarGenerationStrategy(avatarType) {
  const canonicalType = normalizeAvatarType(avatarType);
  const registered = AVATAR_GENERATION_STRATEGIES[canonicalType];

  if (registered) {
    return {
      ...registered,
      capabilities: getAvatarRenderCapabilities(canonicalType),
      aiAvatarType: registered.resolveAiType(),
    };
  }

  const proceduralType = String(avatarType || '').trim().toUpperCase();

  return {
    canonicalType: proceduralType,
    capabilities: getAvatarRenderCapabilities(proceduralType),
    aiAvatarType: resolveAiAvatarType(proceduralType),
    resolveAiType: () => resolveAiAvatarType(proceduralType),
  };
}
