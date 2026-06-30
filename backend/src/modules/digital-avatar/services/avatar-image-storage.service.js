import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { StorageService } from '../../../storage/services/storage.service';
import {
  isStoredImagePath,
  parseImagePayload,
} from '../../../storage/utils/storage-path.util';
import { sanitizeAiResponseForDatabase } from '../utils/avatar-image.util';

export @Injectable()
class AvatarImageStorageService {
  constructor(@Inject(StorageService) storageService) {
    this.storageService = storageService;
    this.logger = new Logger(AvatarImageStorageService.name);
  }

  async resolveStoragePath(userId, version, imagePayload) {
    if (!imagePayload) {
      throw new BadRequestException('Avatar image payload is required');
    }

    const trimmed = imagePayload.trim();

    if (isStoredImagePath(trimmed)) {
      return trimmed;
    }

    const parsed = parseImagePayload(trimmed);

    if (!parsed || parsed.kind !== 'buffer') {
      throw new BadRequestException(
        'Avatar image must be a storage path or a base64 data URL from the AI service',
      );
    }

    const uploadResult = await this.storageService.uploadAvatarImage({
      userId,
      version,
      buffer: parsed.buffer,
      mimeType: parsed.mimeType,
    });

    this.logger.log(
      `Stored avatar image for user ${userId} v${version} at ${uploadResult.storagePath}`,
    );

    return uploadResult.storagePath;
  }

  async persistAvatarGeneration(userId, version, aiResponse) {
    const imagePayload =
      aiResponse?.avatarImageUrl
      || aiResponse?.avatarImage
      || null;

    const storagePath = await this.resolveStoragePath(
      userId,
      version,
      imagePayload,
    );

    return {
      storagePath,
      rawAiResponse: sanitizeAiResponseForDatabase(aiResponse, storagePath),
    };
  }

  async persistAvatarUpdate(userId, version, imagePayload, fallbackPath) {
    if (imagePayload === undefined) {
      return fallbackPath;
    }

    return this.resolveStoragePath(userId, version, imagePayload);
  }
}
