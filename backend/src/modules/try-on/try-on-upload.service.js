import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { StorageService } from '../../storage/services/storage.service';
import { StoragePathResolver } from '../../storage/services/storage-path-resolver.service';

export @Injectable()
class TryOnUploadService {
  constructor(
    @Inject(StorageService) storageService,
    @Inject(StoragePathResolver) storagePathResolver,
  ) {
    this.storageService = storageService;
    this.storagePathResolver = storagePathResolver;
  }

  async uploadPersonImage(userId, imageDto) {
    return this.uploadImage(userId, imageDto, 'person');
  }

  async uploadGarmentImage(userId, imageDto) {
    return this.uploadImage(userId, imageDto, 'garment');
  }

  async uploadImage(userId, imageDto, kind) {
    if (!imageDto?.imageBuffer?.length) {
      throw new BadRequestException('Provide an image upload.');
    }

    const uploadResult = kind === 'person'
      ? await this.storageService.uploadTryOnPersonImage({
        userId,
        buffer: imageDto.imageBuffer,
        mimeType: imageDto.imageMimeType,
      })
      : await this.storageService.uploadTryOnGarmentImage({
        userId,
        buffer: imageDto.imageBuffer,
        mimeType: imageDto.imageMimeType,
      });

    const storagePath = uploadResult.storagePath;
    const displayPath = storagePath;

    const publicUrl = this.storagePathResolver.toPublicUrl(displayPath);

    return {
      storagePath: displayPath,
      originalStoragePath: storagePath,
      imageUrl: publicUrl,
      publicUrl,
      kind,
    };
  }
}
