export function isAvaturnUrl(modelUrl) {
  return Boolean(modelUrl && String(modelUrl).includes('avaturn'));
}

export function isReadyPlayerMeUrl(modelUrl) {
  return Boolean(modelUrl && String(modelUrl).includes('readyplayer.me'));
}

export function isLegacyDeadModelUrl(modelUrl) {
  return isReadyPlayerMeUrl(modelUrl);
}

export function hasCustom3dAvatar(modelUrl) {
  if (!modelUrl) {
    return false;
  }

  return !isLegacyDeadModelUrl(modelUrl);
}

export function normalizeHostedModelUrl(modelUrl) {
  if (!modelUrl || isLegacyDeadModelUrl(modelUrl)) {
    return null;
  }

  return modelUrl;
}
