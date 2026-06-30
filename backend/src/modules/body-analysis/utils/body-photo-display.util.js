import {
  sanitizeBodyPhotoPath,
  sanitizeProcessedBodyPhotoPath,
} from '../../../common/utils/user-image-guard.util';
import { buildUserPngStoragePath } from '../../../storage/utils/storage-path.util';

export function resolveBodyPhotoProcessing(preferences = {}) {
  return preferences.bodyPhotoProcessing || null;
}

export function resolveOriginalBodyImagePath(record, preferences = {}) {
  const processing = resolveBodyPhotoProcessing(preferences);

  const candidates = [
    processing?.originalImage,
    preferences.bodyPhotoOriginal,
    record?.body_image_url,
    preferences.bodyPhoto,
    preferences.body_photo,
    preferences.onboardingBodyPhoto,
  ];

  for (const candidate of candidates) {
    const sanitized = sanitizeBodyPhotoPath(candidate);

    if (sanitized) {
      return sanitized;
    }
  }

  return null;
}

export function resolveTransparentBodyImagePath(userId, preferences = {}) {
  const processing = resolveBodyPhotoProcessing(preferences);

  const candidates = [
    processing?.processedTransparentImage,
    processing?.bodyPhotoProcessed,
    preferences.bodyPhotoProcessed,
    preferences.transparentBodyPhoto,
    userId ? buildUserPngStoragePath(userId) : null,
  ];

  for (const candidate of candidates) {
    const sanitized = sanitizeProcessedBodyPhotoPath(candidate);

    if (sanitized) {
      return sanitized;
    }
  }

  return null;
}

export function resolveDisplayBodyImagePath(userId, record, preferences = {}) {
  return (
    resolveTransparentBodyImagePath(userId, preferences)
    || resolveOriginalBodyImagePath(record, preferences)
  );
}

export function resolveAiBodyImagePath(userId, record, preferences = {}) {
  return resolveDisplayBodyImagePath(userId, record, preferences);
}
