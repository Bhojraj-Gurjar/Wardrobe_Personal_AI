import { join } from 'path';
import { LocalStorageProvider } from '../providers/local-storage.provider';
import {
  AVATAR_PUBLIC_PREFIX,
  BODY_PUBLIC_PREFIX,
  DEFAULT_STORAGE_PROVIDER,
  FACE_PUBLIC_PREFIX,
  STORAGE_PROVIDERS,
} from '../storage.constants';

const DATA_URL_PATTERN = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/;

export function buildAvatarStoragePath(userId, version, extension = 'png') {
  return `${AVATAR_PUBLIC_PREFIX}/${userId}/avatar-v${version}.${extension}`;
}

export function buildAvatarObjectKey(userId, version, extension = 'png') {
  return `avatars/${userId}/avatar-v${version}.${extension}`;
}

export function buildFaceStoragePath(userId, extension = 'jpg') {
  return `${FACE_PUBLIC_PREFIX}/${userId}/face.${extension}`;
}

export function buildFaceObjectKey(userId, extension = 'jpg') {
  return `faces/${userId}/face.${extension}`;
}

export function buildBodyStoragePath(userId, extension = 'jpg') {
  return `${BODY_PUBLIC_PREFIX}/${userId}/body.${extension}`;
}

export function buildBodyObjectKey(userId, extension = 'jpg') {
  return `body/${userId}/body.${extension}`;
}

export function extensionFromMimeType(mimeType = 'image/png') {
  return mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
}

export function parseImagePayload(imagePayload) {
  if (!imagePayload || typeof imagePayload !== 'string') {
    return null;
  }

  const trimmed = imagePayload.trim();

  if (isStoredImagePath(trimmed)) {
    return { kind: 'path', path: trimmed };
  }

  const dataUrlMatch = trimmed.match(DATA_URL_PATTERN);

  if (dataUrlMatch) {
    return {
      kind: 'buffer',
      mimeType: dataUrlMatch[1],
      buffer: Buffer.from(dataUrlMatch[2], 'base64'),
    };
  }

  return null;
}

export function resolvePublicAssetUrl(storagePath, publicBaseUrl) {
  if (!storagePath) {
    return null;
  }

  const trimmed = storagePath.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const base = (publicBaseUrl || '').replace(/\/$/, '');
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return `${base}${path}`;
}

export function isStoredImagePath(value) {
  return (
    typeof value === 'string'
    && (value.startsWith(AVATAR_PUBLIC_PREFIX)
      || value.startsWith(FACE_PUBLIC_PREFIX)
      || value.startsWith(BODY_PUBLIC_PREFIX))
  );
}

export function toFilesystemPath(storagePath, rootDir) {
  const normalized = storagePath.replace(/^\/uploads\//, '');
  return join(rootDir, normalized);
}

export function createStorageProvider(providerName, config) {
  const normalized = (providerName || DEFAULT_STORAGE_PROVIDER).toLowerCase();

  if (normalized === STORAGE_PROVIDERS.LOCAL) {
    return new LocalStorageProvider(config.local);
  }

  if (normalized === STORAGE_PROVIDERS.S3) {
    throw new Error(
      'AWS S3 storage is not enabled. Configure local storage or implement the S3 provider.',
    );
  }

  if (normalized === STORAGE_PROVIDERS.CLOUDINARY) {
    throw new Error(
      'Cloudinary storage is not enabled. Configure local storage or implement the Cloudinary provider.',
    );
  }

  throw new Error(`Unsupported storage provider: ${providerName}`);
}
