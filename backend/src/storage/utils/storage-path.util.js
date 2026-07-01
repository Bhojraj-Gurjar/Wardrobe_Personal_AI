import { join } from 'path';
import { LocalStorageProvider } from '../providers/local-storage.provider';
import { CloudinaryStorageProvider } from '../providers/cloudinary-storage.provider';
import {
  AVATAR_PUBLIC_PREFIX,
  BODY_PUBLIC_PREFIX,
  DEFAULT_STORAGE_PROVIDER,
  FACE_PUBLIC_PREFIX,
  STORAGE_PROVIDERS,
  PRODUCT_PUBLIC_PREFIX,
  SUPPORT_PUBLIC_PREFIX,
  ORDER_PUBLIC_PREFIX,
  TRY_ON_PUBLIC_PREFIX,
  USER_PNG_PUBLIC_PREFIX,
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

export function buildTryOnPersonObjectKey(userId, extension = 'jpg') {
  return `try-on/${userId}/person.${extension}`;
}

export function buildTryOnGarmentObjectKey(userId, extension = 'jpg') {
  return `try-on/${userId}/garment.${extension}`;
}

export function buildTryOnPersonStoragePath(userId, extension = 'jpg') {
  return `${TRY_ON_PUBLIC_PREFIX}/${userId}/person.${extension}`;
}

export function buildTryOnGarmentStoragePath(userId, extension = 'jpg') {
  return `${TRY_ON_PUBLIC_PREFIX}/${userId}/garment.${extension}`;
}

export function buildProductImageObjectKey(productId, fileId, extension = 'jpg') {
  return `products/${productId}/${fileId}.${extension}`;
}

export function buildProductImageStoragePath(productId, fileId, extension = 'jpg') {
  return `${PRODUCT_PUBLIC_PREFIX}/${productId}/${fileId}.${extension}`;
}

export function buildSupportAttachmentObjectKey(ticketId, fileId, extension = 'png') {
  return `support/${ticketId}/${fileId}.${extension}`;
}

export function buildSupportAttachmentStoragePath(ticketId, fileId, extension = 'png') {
  return `${SUPPORT_PUBLIC_PREFIX}/${ticketId}/${fileId}.${extension}`;
}

export function buildOrderDocumentObjectKey(orderId, fileId, extension = 'pdf') {
  return `orders/${orderId}/${fileId}.${extension}`;
}

export function buildOrderDocumentStoragePath(orderId, fileId, extension = 'pdf') {
  return `${ORDER_PUBLIC_PREFIX}/${orderId}/${fileId}.${extension}`;
}

export function buildUserPngStoragePath(userId) {
  return `${USER_PNG_PUBLIC_PREFIX}/${userId}.png`;
}

export function buildUserPngObjectKey(userId) {
  return `user-png/${userId}.png`;
}

export function buildTryOnPersonProcessedStoragePath(userId) {
  return `${TRY_ON_PUBLIC_PREFIX}/${userId}/person.png`;
}

export function buildTryOnResultObjectKey(userId, resultId, extension = 'png') {
  return `try-on/${userId}/results/${resultId}.${extension}`;
}

export function buildTryOnResultStoragePath(userId, resultId, extension = 'png') {
  return `${TRY_ON_PUBLIC_PREFIX}/${userId}/results/${resultId}.${extension}`;
}

export function extensionFromMimeType(mimeType = 'image/png') {
  return mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
}

export function mimeTypeFromExtension(extension = 'jpg') {
  const normalized = extension.toLowerCase().replace('jpeg', 'jpg');

  if (normalized === 'jpg') {
    return 'image/jpeg';
  }

  if (normalized === 'png') {
    return 'image/png';
  }

  if (normalized === 'webp') {
    return 'image/webp';
  }

  return `image/${normalized}`;
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
  const normalizedBase = (publicBaseUrl || '').replace(/\/$/, '');

  if (/^https?:\/\//i.test(trimmed)) {
    const localUploadMatch = trimmed.match(
      /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/uploads\/.*)$/i,
    );

    if (localUploadMatch) {
      const uploadPath = localUploadMatch[1];
      return normalizedBase ? `${normalizedBase}${uploadPath}` : uploadPath;
    }

    return trimmed;
  }

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  return normalizedBase ? `${normalizedBase}${path}` : path;
}

export function isStoredImagePath(value) {
  return (
    typeof value === 'string'
    && (value.startsWith(AVATAR_PUBLIC_PREFIX)
      || value.startsWith(FACE_PUBLIC_PREFIX)
      || value.startsWith(BODY_PUBLIC_PREFIX)
      || value.startsWith(PRODUCT_PUBLIC_PREFIX)
      || value.startsWith(TRY_ON_PUBLIC_PREFIX)
      || value.startsWith(USER_PNG_PUBLIC_PREFIX))
  );
}

export function isFacePhotoPath(value) {
  return typeof value === 'string' && value.startsWith(FACE_PUBLIC_PREFIX);
}

export function isBodyPhotoPath(value) {
  return typeof value === 'string' && value.startsWith(BODY_PUBLIC_PREFIX);
}

export function isTryOnImagePath(value) {
  return typeof value === 'string' && value.startsWith(TRY_ON_PUBLIC_PREFIX);
}

export function isUserPngPath(value) {
  return typeof value === 'string' && value.startsWith(USER_PNG_PUBLIC_PREFIX);
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
    return new CloudinaryStorageProvider(config.cloudinary);
  }

  throw new Error(`Unsupported storage provider: ${providerName}`);
}
