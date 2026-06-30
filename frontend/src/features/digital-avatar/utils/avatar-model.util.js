import { isAvaturnModelUrl, isLegacyReadyPlayerMeUrl } from '@/features/digital-avatar/utils/avatar-creator.util';

export function extractHostedAvatarId(modelUrl) {
  if (!modelUrl) return null;

  const rpmMatch = String(modelUrl).match(/readyplayer\.me\/([a-f0-9]{24})/i);
  if (rpmMatch?.[1]) return rpmMatch[1];

  return null;
}

export function normalizeHostedModelUrl(modelUrl) {
  if (!modelUrl) return null;

  if (isLegacyReadyPlayerMeUrl(modelUrl)) {
    return modelUrl;
  }

  return modelUrl;
}

export function isHostedAvatarModelUrl(modelUrl) {
  return isAvaturnModelUrl(modelUrl) || isLegacyReadyPlayerMeUrl(modelUrl);
}

export function resolveAvatarModelUrl({ model3dUrl, bodyType, resolvePresetUrl }) {
  if (model3dUrl) {
    return normalizeHostedModelUrl(model3dUrl) || model3dUrl;
  }

  return resolvePresetUrl?.({ bodyType }) || null;
}
