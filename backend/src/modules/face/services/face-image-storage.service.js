import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { StorageService } from '../../../storage/services/storage.service';

export @Injectable()
class FaceImageStorageService {
  constructor(@Inject(StorageService) storageService) {
    this.storageService = storageService;
    this.logger = new Logger(FaceImageStorageService.name);
  }

  async replaceFaceImage(userId, buffer, mimeType, previousStoragePath = null) {
    const uploadResult = await this.storageService.uploadFaceImage({
      userId,
      buffer,
      mimeType,
    });

    await this.storageService.deleteFolderFilesExcept(
      `faces/${userId}`,
      uploadResult.storagePath,
    );

    if (
      previousStoragePath
      && previousStoragePath !== uploadResult.storagePath
    ) {
      await this.storageService.deleteStoredFile(previousStoragePath);
    }

    this.logger.log(
      `Stored face image for user ${userId} at ${uploadResult.storagePath}`,
    );

    return uploadResult.storagePath;
  }

  async readFaceImage(storagePath) {
    if (!storagePath) {
      return null;
    }

    return this.storageService.readStoredFile(storagePath);
  }
}
