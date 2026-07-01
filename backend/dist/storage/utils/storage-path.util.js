"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get buildAvatarObjectKey () {
        return buildAvatarObjectKey;
    },
    get buildAvatarStoragePath () {
        return buildAvatarStoragePath;
    },
    get buildBodyObjectKey () {
        return buildBodyObjectKey;
    },
    get buildBodyStoragePath () {
        return buildBodyStoragePath;
    },
    get buildFaceObjectKey () {
        return buildFaceObjectKey;
    },
    get buildFaceStoragePath () {
        return buildFaceStoragePath;
    },
    get buildOrderDocumentObjectKey () {
        return buildOrderDocumentObjectKey;
    },
    get buildOrderDocumentStoragePath () {
        return buildOrderDocumentStoragePath;
    },
    get buildProductImageObjectKey () {
        return buildProductImageObjectKey;
    },
    get buildProductImageStoragePath () {
        return buildProductImageStoragePath;
    },
    get buildSupportAttachmentObjectKey () {
        return buildSupportAttachmentObjectKey;
    },
    get buildSupportAttachmentStoragePath () {
        return buildSupportAttachmentStoragePath;
    },
    get buildTryOnGarmentObjectKey () {
        return buildTryOnGarmentObjectKey;
    },
    get buildTryOnGarmentStoragePath () {
        return buildTryOnGarmentStoragePath;
    },
    get buildTryOnPersonObjectKey () {
        return buildTryOnPersonObjectKey;
    },
    get buildTryOnPersonProcessedStoragePath () {
        return buildTryOnPersonProcessedStoragePath;
    },
    get buildTryOnPersonStoragePath () {
        return buildTryOnPersonStoragePath;
    },
    get buildTryOnResultObjectKey () {
        return buildTryOnResultObjectKey;
    },
    get buildTryOnResultStoragePath () {
        return buildTryOnResultStoragePath;
    },
    get buildUserPngStoragePath () {
        return buildUserPngStoragePath;
    },
    get createStorageProvider () {
        return createStorageProvider;
    },
    get extensionFromMimeType () {
        return extensionFromMimeType;
    },
    get isBodyPhotoPath () {
        return isBodyPhotoPath;
    },
    get isFacePhotoPath () {
        return isFacePhotoPath;
    },
    get isStoredImagePath () {
        return isStoredImagePath;
    },
    get isTryOnImagePath () {
        return isTryOnImagePath;
    },
    get isUserPngPath () {
        return isUserPngPath;
    },
    get mimeTypeFromExtension () {
        return mimeTypeFromExtension;
    },
    get parseImagePayload () {
        return parseImagePayload;
    },
    get resolvePublicAssetUrl () {
        return resolvePublicAssetUrl;
    },
    get toFilesystemPath () {
        return toFilesystemPath;
    }
});
const _path = require("path");
const _localstorageprovider = require("../providers/local-storage.provider");
const _storageconstants = require("../storage.constants");
const DATA_URL_PATTERN = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/;
function buildAvatarStoragePath(userId, version, extension = 'png') {
    return `${_storageconstants.AVATAR_PUBLIC_PREFIX}/${userId}/avatar-v${version}.${extension}`;
}
function buildAvatarObjectKey(userId, version, extension = 'png') {
    return `avatars/${userId}/avatar-v${version}.${extension}`;
}
function buildFaceStoragePath(userId, extension = 'jpg') {
    return `${_storageconstants.FACE_PUBLIC_PREFIX}/${userId}/face.${extension}`;
}
function buildFaceObjectKey(userId, extension = 'jpg') {
    return `faces/${userId}/face.${extension}`;
}
function buildBodyStoragePath(userId, extension = 'jpg') {
    return `${_storageconstants.BODY_PUBLIC_PREFIX}/${userId}/body.${extension}`;
}
function buildBodyObjectKey(userId, extension = 'jpg') {
    return `body/${userId}/body.${extension}`;
}
function buildTryOnPersonObjectKey(userId, extension = 'jpg') {
    return `try-on/${userId}/person.${extension}`;
}
function buildTryOnGarmentObjectKey(userId, extension = 'jpg') {
    return `try-on/${userId}/garment.${extension}`;
}
function buildTryOnPersonStoragePath(userId, extension = 'jpg') {
    return `${_storageconstants.TRY_ON_PUBLIC_PREFIX}/${userId}/person.${extension}`;
}
function buildTryOnGarmentStoragePath(userId, extension = 'jpg') {
    return `${_storageconstants.TRY_ON_PUBLIC_PREFIX}/${userId}/garment.${extension}`;
}
function buildProductImageObjectKey(productId, fileId, extension = 'jpg') {
    return `products/${productId}/${fileId}.${extension}`;
}
function buildProductImageStoragePath(productId, fileId, extension = 'jpg') {
    return `${_storageconstants.PRODUCT_PUBLIC_PREFIX}/${productId}/${fileId}.${extension}`;
}
function buildSupportAttachmentObjectKey(ticketId, fileId, extension = 'png') {
    return `support/${ticketId}/${fileId}.${extension}`;
}
function buildSupportAttachmentStoragePath(ticketId, fileId, extension = 'png') {
    return `${_storageconstants.SUPPORT_PUBLIC_PREFIX}/${ticketId}/${fileId}.${extension}`;
}
function buildOrderDocumentObjectKey(orderId, fileId, extension = 'pdf') {
    return `orders/${orderId}/${fileId}.${extension}`;
}
function buildOrderDocumentStoragePath(orderId, fileId, extension = 'pdf') {
    return `${_storageconstants.ORDER_PUBLIC_PREFIX}/${orderId}/${fileId}.${extension}`;
}
function buildUserPngStoragePath(userId) {
    return `${_storageconstants.USER_PNG_PUBLIC_PREFIX}/${userId}.png`;
}
function buildTryOnPersonProcessedStoragePath(userId) {
    return `${_storageconstants.TRY_ON_PUBLIC_PREFIX}/${userId}/person.png`;
}
function buildTryOnResultObjectKey(userId, resultId, extension = 'png') {
    return `try-on/${userId}/results/${resultId}.${extension}`;
}
function buildTryOnResultStoragePath(userId, resultId, extension = 'png') {
    return `${_storageconstants.TRY_ON_PUBLIC_PREFIX}/${userId}/results/${resultId}.${extension}`;
}
function extensionFromMimeType(mimeType = 'image/png') {
    return mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
}
function mimeTypeFromExtension(extension = 'jpg') {
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
function parseImagePayload(imagePayload) {
    if (!imagePayload || typeof imagePayload !== 'string') {
        return null;
    }
    const trimmed = imagePayload.trim();
    if (isStoredImagePath(trimmed)) {
        return {
            kind: 'path',
            path: trimmed
        };
    }
    const dataUrlMatch = trimmed.match(DATA_URL_PATTERN);
    if (dataUrlMatch) {
        return {
            kind: 'buffer',
            mimeType: dataUrlMatch[1],
            buffer: Buffer.from(dataUrlMatch[2], 'base64')
        };
    }
    return null;
}
function resolvePublicAssetUrl(storagePath, publicBaseUrl) {
    if (!storagePath) {
        return null;
    }
    const trimmed = storagePath.trim();
    const normalizedBase = (publicBaseUrl || '').replace(/\/$/, '');
    if (/^https?:\/\//i.test(trimmed)) {
        const localUploadMatch = trimmed.match(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(\/uploads\/.*)$/i);
        if (localUploadMatch) {
            const uploadPath = localUploadMatch[1];
            return normalizedBase ? `${normalizedBase}${uploadPath}` : uploadPath;
        }
        return trimmed;
    }
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return normalizedBase ? `${normalizedBase}${path}` : path;
}
function isStoredImagePath(value) {
    return typeof value === 'string' && (value.startsWith(_storageconstants.AVATAR_PUBLIC_PREFIX) || value.startsWith(_storageconstants.FACE_PUBLIC_PREFIX) || value.startsWith(_storageconstants.BODY_PUBLIC_PREFIX) || value.startsWith(_storageconstants.PRODUCT_PUBLIC_PREFIX) || value.startsWith(_storageconstants.TRY_ON_PUBLIC_PREFIX) || value.startsWith(_storageconstants.USER_PNG_PUBLIC_PREFIX));
}
function isFacePhotoPath(value) {
    return typeof value === 'string' && value.startsWith(_storageconstants.FACE_PUBLIC_PREFIX);
}
function isBodyPhotoPath(value) {
    return typeof value === 'string' && value.startsWith(_storageconstants.BODY_PUBLIC_PREFIX);
}
function isTryOnImagePath(value) {
    return typeof value === 'string' && value.startsWith(_storageconstants.TRY_ON_PUBLIC_PREFIX);
}
function isUserPngPath(value) {
    return typeof value === 'string' && value.startsWith(_storageconstants.USER_PNG_PUBLIC_PREFIX);
}
function toFilesystemPath(storagePath, rootDir) {
    const normalized = storagePath.replace(/^\/uploads\//, '');
    return (0, _path.join)(rootDir, normalized);
}
function createStorageProvider(providerName, config) {
    const normalized = (providerName || _storageconstants.DEFAULT_STORAGE_PROVIDER).toLowerCase();
    if (normalized === _storageconstants.STORAGE_PROVIDERS.LOCAL) {
        return new _localstorageprovider.LocalStorageProvider(config.local);
    }
    if (normalized === _storageconstants.STORAGE_PROVIDERS.S3) {
        throw new Error('AWS S3 storage is not enabled. Configure local storage or implement the S3 provider.');
    }
    if (normalized === _storageconstants.STORAGE_PROVIDERS.CLOUDINARY) {
        throw new Error('Cloudinary storage is not enabled. Configure local storage or implement the Cloudinary provider.');
    }
    throw new Error(`Unsupported storage provider: ${providerName}`);
}

//# sourceMappingURL=storage-path.util.js.map