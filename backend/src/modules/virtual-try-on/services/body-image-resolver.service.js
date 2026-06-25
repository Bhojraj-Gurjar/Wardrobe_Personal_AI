import { Inject, Injectable } from '@nestjs/common';
import { sanitizeBodyPhotoPath } from '../../../common/utils/user-image-guard.util';
import { StoragePathResolver } from '../../../storage/services/storage-path-resolver.service';
import { BodyImageStorageService } from '../../body-analysis/services/body-image-storage.service';
import { VirtualTryOnRepository } from '../virtual-try-on.repository';

/**
 * Read-only resolver for onboarding/body-analysis photos.
 * Virtual Try-On must never write facePhoto, bodyPhoto, or profilePhoto.
 */
export @Injectable()
class BodyImageResolverService {
  constructor(
    @Inject(VirtualTryOnRepository) repository,
    @Inject(StoragePathResolver) storagePathResolver,
    @Inject(BodyImageStorageService) bodyImageStorageService,
  ) {
    this.repository = repository;
    this.storagePathResolver = storagePathResolver;
    this.bodyImageStorageService = bodyImageStorageService;
  }

  async resolveBodyImagePath(userId) {
    const user = await this.repository.findUserContext(userId);

    if (!user) {
      return null;
    }

    const preferences = user.profile?.preferences || {};
    const candidates = [
      user.body_analysis?.body_image_url,
      preferences.bodyPhoto,
      preferences.body_photo,
      preferences.onboardingBodyPhoto,
    ];

    for (const candidate of candidates) {
      const sanitized = sanitizeBodyPhotoPath(candidate);

      if (sanitized) {
        return sanitized;
      }
    }

    return this.bodyImageStorageService.findStoredBodyImagePath(userId);
  }

  async syncTryOnSessionInput(userId) {
    const bodyImagePath = await this.resolveBodyImagePath(userId);

    if (!bodyImagePath) {
      return null;
    }

    await this.repository.upsertSession(userId, {
      body_image: bodyImagePath,
    });

    return {
      tryOnInputImage: bodyImagePath,
      tryOnInputImageUrl: this.storagePathResolver.toPublicUrl(bodyImagePath),
      bodyImage: bodyImagePath,
      bodyImageUrl: this.storagePathResolver.toPublicUrl(bodyImagePath),
    };
  }

  /** @deprecated Use syncTryOnSessionInput — does not mutate profile photos. */
  async syncUserBodyImage(userId) {
    return this.syncTryOnSessionInput(userId);
  }

  toPublicUrl(storagePath) {
    return storagePath
      ? this.storagePathResolver.toPublicUrl(storagePath)
      : null;
  }
}
