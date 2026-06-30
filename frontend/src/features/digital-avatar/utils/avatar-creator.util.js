import {
  AVATAR_CREATOR_PROVIDER,
  AVATAR_CREATOR_PROVIDERS,
  AVATURN_BASE_URL,
  AVATURN_SUBDOMAIN,
} from '@/features/digital-avatar/constants/avatar-creator.constants';

export function resolveAvatarCreatorProvider() {
  const configured = String(AVATAR_CREATOR_PROVIDER || '').toLowerCase();

  if (configured === AVATAR_CREATOR_PROVIDERS.NATIVE) {
    return AVATAR_CREATOR_PROVIDERS.NATIVE;
  }

  if (configured === AVATAR_CREATOR_PROVIDERS.AVATURN) {
    return AVATAR_CREATOR_PROVIDERS.AVATURN;
  }

  return AVATAR_CREATOR_PROVIDERS.AVATURN;
}

export function buildAvaturnCreatorUrl() {
  if (!AVATURN_SUBDOMAIN?.trim()) {
    return null;
  }

  return AVATURN_BASE_URL;
}

export function isAvaturnConfigured() {
  return Boolean(AVATURN_SUBDOMAIN?.trim());
}

export function isAvaturnModelUrl(modelUrl) {
  return Boolean(modelUrl && String(modelUrl).includes('avaturn'));
}

export function isLegacyReadyPlayerMeUrl(modelUrl) {
  return Boolean(modelUrl && String(modelUrl).includes('readyplayer.me'));
}

export function isHostedAvatarModelUrl(modelUrl) {
  if (!modelUrl) return false;
  const value = String(modelUrl);
  return (
    value.endsWith('.glb')
    || value.includes('.glb?')
    || isAvaturnModelUrl(value)
    || isLegacyReadyPlayerMeUrl(value)
  );
}

export function hasCustom3dAvatar(avatar) {
  if (avatar?.hasCustom3dAvatar) {
    return true;
  }

  const modelUrl = avatar?.model3dUrl;
  if (!modelUrl) {
    return false;
  }

  return !isLegacyReadyPlayerMeUrl(modelUrl);
}

export function getAvatarCreatorConfigSummary() {
  return {
    provider: resolveAvatarCreatorProvider(),
    avaturnSubdomain: AVATURN_SUBDOMAIN,
    avaturnUrl: buildAvaturnCreatorUrl(),
  };
}

export async function probeCreatorEndpoint(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function mapGenerationProfileToNativeDefaults(generationProfile, avatar) {
  const bodyTypeMap = {
    slim: 'slim',
    athletic: 'athletic',
    average: 'average',
    muscular: 'muscular',
    curvy: 'average',
    'plus-size': 'average',
  };

  const rpmBody = String(generationProfile?.rpmBodyType || generationProfile?.bodyType || '')
    .toLowerCase()
    .replace(/_/g, '-');

  const normalizedBody = bodyTypeMap[rpmBody] || avatar?.bodyType || 'athletic';

  const skinTone = String(generationProfile?.skinTone || avatar?.skinTone || 'medium')
    .toLowerCase()
    .replace(/_/g, '-');

  const hairColor = String(generationProfile?.hairColor || avatar?.hairColor || 'black')
    .toLowerCase()
    .replace(/_/g, '-');

  return {
    bodyType: normalizedBody,
    skinTone,
    hairColor,
  };
}
