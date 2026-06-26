import { Inject, Injectable } from '@nestjs/common';
import { StoragePathResolver } from '../../../storage/services/storage-path-resolver.service';
import { BodyImageStorageService } from '../../body-analysis/services/body-image-storage.service';
import { BodyPhotoProcessingService } from '../../body-analysis/services/body-photo-processing.service';
import {
  resolveDisplayBodyImagePath as resolveStoredDisplayBodyImagePath,
  resolveOriginalBodyImagePath,
} from '../../body-analysis/utils/body-photo-display.util';
import { TryOnUserRepository } from '../repositories/try-on-user.repository';

/**
 * Read-only onboarding body photo resolver for /try-on.
 * Never writes facePhoto, bodyPhoto, or profilePhoto.
 */
export @Injectable()
class TryOnBodyResolverService {
  constructor(
    @Inject(TryOnUserRepository) userRepository,
    @Inject(StoragePathResolver) storagePathResolver,
    @Inject(BodyImageStorageService) bodyImageStorageService,
    @Inject(BodyPhotoProcessingService) bodyPhotoProcessingService,
  ) {
    this.userRepository = userRepository;
    this.storagePathResolver = storagePathResolver;
    this.bodyImageStorageService = bodyImageStorageService;
    this.bodyPhotoProcessingService = bodyPhotoProcessingService;
  }

  async resolveBodyImagePath(userId) {
    const user = await this.userRepository.findUserContext(userId);

    if (!user) {
      return null;
    }

    const preferences = user.profile?.preferences || {};
    const originalPath = resolveOriginalBodyImagePath(
      user.body_analysis,
      preferences,
    );

    if (originalPath) {
      return originalPath;
    }

    return this.bodyImageStorageService.findStoredBodyImagePath(userId);
  }

  async resolveDisplayBodyImagePath(userId) {
    const user = await this.userRepository.findUserContext(userId);

    if (!user) {
      return null;
    }

    const preferences = user.profile?.preferences || {};
    const transparentPath = preferences.bodyPhotoProcessing?.processedTransparentImage
      || preferences.bodyPhotoProcessing?.bodyPhotoProcessed
      || preferences.bodyPhotoProcessed
      || preferences.transparentBodyPhoto;

    if (
      transparentPath
      && this.bodyPhotoProcessingService.transparentPngExists(userId)
    ) {
      return transparentPath;
    }

    return resolveStoredDisplayBodyImagePath(
      userId,
      user.body_analysis,
      preferences,
    ) || this.resolveBodyImagePath(userId);
  }

  async getSetup(userId) {
    const user = await this.userRepository.findUserContext(userId);
    const bodyImagePath = await this.resolveBodyImagePath(userId);

    if (!bodyImagePath) {
      return {
        ready: false,
        message: 'Complete onboarding with a body photo to unlock Try-On Studio.',
        bodyPhotoUrl: null,
        userName: user?.profile?.name || null,
        bodyType: user?.profile?.body_type || user?.body_analysis?.body_type || null,
      };
    }

    const displayPath = await this.resolveDisplayBodyImagePath(userId);
    const bodyPhotoUrl = this.storagePathResolver.toPublicUrl(displayPath || bodyImagePath);

    return {
      ready: true,
      bodyPhotoUrl,
      bodyImageUrl: bodyPhotoUrl,
      bodyPhotoReference: bodyImagePath,
      userName: user?.profile?.name || null,
      bodyType: user?.profile?.body_type || user?.body_analysis?.body_type || null,
    };
  }

  toPublicUrl(storagePath) {
    return storagePath
      ? this.storagePathResolver.toPublicUrl(storagePath)
      : null;
  }
}
