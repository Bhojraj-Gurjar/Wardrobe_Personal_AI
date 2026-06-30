import { resolveStorageOrigin } from '@/constants/api';

const STORAGE_ORIGIN = resolveStorageOrigin();

function toAbsoluteAssetUrl(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = String(value).trim();

  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith('/')) {
    return `${STORAGE_ORIGIN}${trimmed}`;
  }

  return `${STORAGE_ORIGIN}/${trimmed}`;
}

function isBodyAssetUrl(url) {
  return url.includes('/uploads/body/')
    || url.includes('/uploads/user-png/')
    || url.includes('/uploads/try-on/');
}

export function resolveBodyPhotoUrl(apiData, profile, options = {}) {
  const { preferOriginal = false } = options;
  const preferences = profile?.preferences || {};
  const processing = preferences.bodyPhotoProcessing || apiData?.bodyPhotoProcessing || null;

  const originalCandidates = [
    apiData?.sessionBodyPhotoUrl,
    apiData?.bodyPhotoOriginalUrl,
    profile?.bodyPhotoOriginalUrl,
    apiData?.body_image_url,
    processing?.originalImage,
    preferences.bodyPhotoOriginal,
    preferences.bodyPhoto,
    preferences.body_photo,
    preferences.onboardingBodyPhoto,
    apiData?.bodyPhotoUrl,
    apiData?.bodyImageUrl,
    profile?.bodyPhotoUrl,
    profile?.bodyImageUrl,
  ];

  const transparentCandidates = [
    apiData?.bodyPhotoTransparentUrl,
    profile?.bodyPhotoTransparentUrl,
    apiData?.transparentImageUrl,
    processing?.processedTransparentImage,
    processing?.bodyPhotoProcessed,
    preferences.bodyPhotoProcessed,
    preferences.transparentBodyPhoto,
  ];

  const candidateGroups = preferOriginal
    ? [originalCandidates, transparentCandidates]
    : [transparentCandidates, originalCandidates];

  for (const candidates of candidateGroups) {
    for (const candidate of candidates) {
      const resolved = toAbsoluteAssetUrl(candidate);

      if (resolved && isBodyAssetUrl(resolved)) {
        return resolved;
      }
    }
  }

  return null;
}

/** Merge body photo URLs from setup, body analysis, and profile. */
export function resolveVirtualTryOnBodyPhotoUrl({
  setup,
  profile,
  bodyAnalysis,
  temporaryBodyPhotoUrl,
} = {}) {
  if (temporaryBodyPhotoUrl) {
    return temporaryBodyPhotoUrl;
  }

  const sources = [bodyAnalysis, setup, profile];

  for (const source of sources) {
    const resolved = resolveBodyPhotoUrl(source, profile, { preferOriginal: true });

    if (resolved) {
      return resolved;
    }
  }

  for (const source of sources) {
    const fallback = source?.bodyPhotoUrl || source?.bodyImageUrl;

    if (fallback && typeof fallback === 'string' && fallback.startsWith('http')) {
      return fallback;
    }
  }

  return null;
}
