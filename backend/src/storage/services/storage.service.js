import { Inject, Injectable, Logger } from '@nestjs/common';
import { access, readdir, readFile } from 'fs/promises';
import { join, extname } from 'path';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_STORAGE_PROVIDER } from '../storage.constants';
import { createStorageProvider } from '../utils/storage-path.util';
import {
  buildAvatarObjectKey,
  buildBodyObjectKey,
  buildFaceObjectKey,
  buildUserPngObjectKey,
  buildProductImageObjectKey,
  buildSupportAttachmentObjectKey,
  buildOrderDocumentObjectKey,
  buildTryOnGarmentObjectKey,
  buildTryOnPersonObjectKey,
  buildTryOnResultObjectKey,
  extensionFromMimeType,
  mimeTypeFromExtension,
  resolvePublicAssetUrl,
  toFilesystemPath,
} from '../utils/storage-path.util';
import {
  BODY_PUBLIC_PREFIX,
  BODY_STORAGE_FOLDER,
  FACE_STORAGE_FOLDER,
  TRY_ON_STORAGE_FOLDER,
} from '../storage.constants';

function resolveStorageProviderName(configService) {
  const explicit = configService.get('storage.provider');

  if (explicit) {
    return explicit;
  }

  const cloudName = configService.get('storage.cloudinary.cloudName');
  const apiKey = configService.get('storage.cloudinary.apiKey');
  const apiSecret = configService.get('storage.cloudinary.apiSecret');

  if (cloudName && apiKey && apiSecret) {
    return 'cloudinary';
  }

  return DEFAULT_STORAGE_PROVIDER;
}

export @Injectable()
class StorageService {
  constructor(@Inject(ConfigService) configService) {
    this.configService = configService;
    this.logger = new Logger(StorageService.name);
    const providerName = resolveStorageProviderName(configService);
    this.provider = createStorageProvider(
      providerName,
      {
        local: configService.get('storage.local'),
        cloudinary: configService.get('storage.cloudinary'),
      },
    );
    this.logger.log(`Storage provider: ${providerName}`);
  }

  getProviderName() {
    return resolveStorageProviderName(this.configService);
  }

  resolvePublicUrl(storagePath) {
    if (!storagePath) {
      return null;
    }

    const providerUrl = this.provider.resolvePublicUrl?.(storagePath);

    if (providerUrl) {
      return providerUrl;
    }

    return resolvePublicAssetUrl(
      storagePath,
      this.configService.get('storage.local.publicBaseUrl'),
    );
  }

  getPublicBaseUrl() {
    return this.configService.get('storage.local.publicBaseUrl');
  }

  async uploadAvatarImage({ userId, version, buffer, mimeType }) {
    const extension = extensionFromMimeType(mimeType);
    const objectKey = buildAvatarObjectKey(userId, version, extension);

    return this.provider.upload({
      buffer,
      mimeType,
      objectKey,
    });
  }

  async uploadFaceImage({ userId, buffer, mimeType }) {
    const extension = extensionFromMimeType(mimeType);
    const objectKey = buildFaceObjectKey(userId, extension);

    return this.provider.upload({
      buffer,
      mimeType,
      objectKey,
    });
  }

  async uploadBodyImage({ userId, buffer, mimeType }) {
    const extension = extensionFromMimeType(mimeType);
    const objectKey = buildBodyObjectKey(userId, extension);

    return this.provider.upload({
      buffer,
      mimeType,
      objectKey,
    });
  }

  async uploadUserPng(userId, buffer) {
    return this.provider.upload({
      buffer,
      mimeType: 'image/png',
      objectKey: buildUserPngObjectKey(userId),
    });
  }

  async uploadTryOnPersonImage({ userId, buffer, mimeType }) {
    const extension = extensionFromMimeType(mimeType);
    const objectKey = buildTryOnPersonObjectKey(userId, extension);

    return this.provider.upload({
      buffer,
      mimeType,
      objectKey,
    });
  }

  async uploadTryOnGarmentImage({ userId, buffer, mimeType }) {
    const extension = extensionFromMimeType(mimeType);
    const objectKey = buildTryOnGarmentObjectKey(userId, extension);

    return this.provider.upload({
      buffer,
      mimeType,
      objectKey,
    });
  }

  async uploadTryOnResultImage({ userId, resultId, buffer, mimeType = 'image/png' }) {
    const extension = extensionFromMimeType(mimeType);
    const objectKey = buildTryOnResultObjectKey(userId, resultId, extension);

    return this.provider.upload({
      buffer,
      mimeType,
      objectKey,
    });
  }

  async uploadProductImage({ productId, fileId, buffer, mimeType }) {
    const extension = extensionFromMimeType(mimeType);
    const objectKey = buildProductImageObjectKey(productId, fileId, extension);

    return this.provider.upload({
      buffer,
      mimeType,
      objectKey,
    });
  }

  async uploadSupportAttachment({ ticketId, fileId, buffer, mimeType }) {
    const extension = extensionFromMimeType(mimeType);
    const objectKey = buildSupportAttachmentObjectKey(ticketId, fileId, extension);

    return this.provider.upload({
      buffer,
      mimeType,
      objectKey,
    });
  }

  async uploadOrderDocument({ orderId, fileId, buffer, mimeType }) {
    const extension = extensionFromMimeType(mimeType);
    const objectKey = buildOrderDocumentObjectKey(orderId, fileId, extension);

    return this.provider.upload({
      buffer,
      mimeType,
      objectKey,
    });
  }

  async deleteStoredFile(storagePath) {
    return this.provider.deleteStoragePath(storagePath);
  }

  async storedFileExists(storagePath) {
    if (!storagePath) {
      return false;
    }

    if (typeof this.provider.storagePathExists === 'function') {
      return this.provider.storagePathExists(storagePath);
    }

    const rootDir = this.configService.get('storage.local.rootDir') || 'uploads';
    const absolutePath = toFilesystemPath(storagePath, rootDir);

    try {
      await access(absolutePath);
      return true;
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return false;
      }

      throw error;
    }
  }

  async deleteFolderFilesExcept(relativeFolder, keepStoragePath) {
    const rootDir = this.configService.get('storage.local.rootDir') || 'uploads';
    const normalizedFolder = relativeFolder.replace(/\\/g, '/').replace(/^\/+/, '');
    const folderPath = join(rootDir, normalizedFolder);
    const keepFileName = keepStoragePath?.split('/').pop();

    try {
      const files = await readdir(folderPath);

      await Promise.all(files.map(async (file) => {
        if (keepFileName && file === keepFileName) {
          return;
        }

        const storagePath = `/${normalizedFolder}/${file}`.replace(/\/+/g, '/');
        await this.deleteStoredFile(storagePath.startsWith('/uploads')
          ? storagePath
          : `/uploads${storagePath}`);
      }));
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async readStoredFile(storagePath) {
    if (!storagePath) {
      return null;
    }

    if (typeof this.provider.readStoragePath === 'function') {
      return this.provider.readStoragePath(storagePath);
    }

    const rootDir = this.configService.get('storage.local.rootDir') || 'uploads';
    const absolutePath = toFilesystemPath(storagePath, rootDir);
    const extension = extname(absolutePath).replace('.', '') || 'jpg';

    try {
      const buffer = await readFile(absolutePath);

      return {
        buffer,
        mimeType: mimeTypeFromExtension(extension),
      };
    } catch (error) {
      if (error?.code === 'ENOENT') {
        this.logger.warn(`Stored file missing: ${storagePath}`);
        return null;
      }

      throw error;
    }
  }

  async deleteFaceImagesForUser(userId) {
    return this.provider.deleteFolder(`${FACE_STORAGE_FOLDER}/${userId}`);
  }

  async deleteBodyImagesForUser(userId) {
    return this.provider.deleteFolder(`${BODY_STORAGE_FOLDER}/${userId}`);
  }

  async findBodyImageForUser(userId) {
    const rootDir = this.configService.get('storage.local.rootDir') || 'uploads';
    const folderPath = join(rootDir, BODY_STORAGE_FOLDER, userId);

    try {
      const files = await readdir(folderPath);
      const match = files.find((file) => /^body\./i.test(file));

      if (!match) {
        return null;
      }

      return `${BODY_PUBLIC_PREFIX}/${userId}/${match}`.replace(/\/+/g, '/');
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return null;
      }

      throw error;
    }
  }
}
