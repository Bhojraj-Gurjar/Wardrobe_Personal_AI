/**
 * @typedef {object} StorageUploadInput
 * @property {Buffer} buffer
 * @property {string} mimeType
 * @property {string} objectKey Relative path under storage root (e.g. avatars/25/avatar-v1.png)
 */

/**
 * @typedef {object} StorageUploadResult
 * @property {string} storagePath Public path stored in PostgreSQL (e.g. /uploads/avatars/25/avatar-v1.png)
 * @property {string} key Object key relative to provider root
 * @property {string} provider Provider identifier (local | s3 | cloudinary)
 */

/**
 * @typedef {object} IStorageProvider
 * @property {(input: StorageUploadInput) => Promise<StorageUploadResult>} upload
 */

export {};
