import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { StorageService } from '../../../storage/services/storage.service';

export @Injectable()
class BodyImageStorageService {
  constructor(@Inject(StorageService) storageService) {
    this.storageService = storageService;
    this.logger = new Logger(BodyImageStorageService.name);
  }

  async replaceBodyImage(userId, buffer, mimeType, previousStoragePath = null) {
    const uploadResult = await this.storageService.uploadBodyImage({
      userId,
      buffer,
      mimeType,
    });

    await this.storageService.deleteFolderFilesExcept(
      `body/${userId}`,
      uploadResult.storagePath,
    );

    if (
      previousStoragePath
      && previousStoragePath !== uploadResult.storagePath
    ) {
      await this.storageService.deleteStoredFile(previousStoragePath);
    }

    this.logger.log(
      `Stored body image for user ${userId} at ${uploadResult.storagePath}`,
    );

    return uploadResult.storagePath;
  }

  findStoredBodyImagePath(userId) {
    return this.storageService.findBodyImageForUser(userId);
  }

  async readBodyImage(storagePath) {
    if (!storagePath) {
      return null;
    }

    return this.storageService.readStoredFile(storagePath);
  }

  async bodyImageExists(storagePath) {
    if (!storagePath) {
      return false;
    }

    return this.storageService.storedFileExists(storagePath);
  }
}
