import { Inject, Injectable, Logger } from '@nestjs/common';
import { readdir } from 'fs/promises';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_STORAGE_PROVIDER } from '../storage.constants';
import { createStorageProvider } from '../utils/storage-path.util';
import {
  buildAvatarObjectKey,
  buildBodyObjectKey,
  buildFaceObjectKey,
  extensionFromMimeType,
} from '../utils/storage-path.util';
import { BODY_PUBLIC_PREFIX, BODY_STORAGE_FOLDER, FACE_STORAGE_FOLDER } from '../storage.constants';

export @Injectable()
class StorageService {
  constructor(@Inject(ConfigService) configService) {
    this.configService = configService;
    this.logger = new Logger(StorageService.name);
    this.provider = createStorageProvider(
      configService.get('storage.provider'),
      {
        local: configService.get('storage.local'),
      },
    );
    this.logger.log('Avatar storage provider: local filesystem');
  }

  getProviderName() {
    return this.configService.get('storage.provider') || DEFAULT_STORAGE_PROVIDER;
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

  async deleteStoredFile(storagePath) {
    return this.provider.deleteStoragePath(storagePath);
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
