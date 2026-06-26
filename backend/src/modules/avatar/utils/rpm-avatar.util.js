const RPM_CDN_BASE = 'https://models.readyplayer.me';

export function extractRpmAvatarId(modelUrl) {
  if (!modelUrl) {
    return null;
  }

  const match = String(modelUrl).match(/readyplayer\.me\/([a-f0-9]{24})/i);
  return match?.[1] || null;
}

export function buildRpmModelUrl(avatarId, options = {}) {
  if (!avatarId) {
    return null;
  }

  const params = new URLSearchParams();
  params.set('meshLod', String(options.meshLod ?? 1));
  params.set('textureAtlas', options.textureAtlas ?? 'none');

  if (options.quality) {
    params.set('quality', options.quality);
  }

  const query = params.toString();
  return `${RPM_CDN_BASE}/${avatarId}.glb${query ? `?${query}` : ''}`;
}

export function normalizeRpmModelUrl(modelUrl) {
  const avatarId = extractRpmAvatarId(modelUrl);

  if (!avatarId) {
    return modelUrl || null;
  }

  return buildRpmModelUrl(avatarId, { meshLod: 1, textureAtlas: 'none' });
}

export function buildRpmEditorConfig(generationProfile = {}) {
  return {
    bodyType: 'fullbody',
    quickStart: true,
    language: 'en',
    clearCache: false,
    ...(generationProfile.rpmBodyType
      ? { bodyType: 'fullbody' }
      : {}),
  };
}

export function isReadyPlayerMeUrl(modelUrl) {
  return Boolean(modelUrl && String(modelUrl).includes('readyplayer.me'));
}
