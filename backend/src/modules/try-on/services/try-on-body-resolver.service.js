import { Inject, Injectable } from '@nestjs/common';
import { sanitizeBodyPhotoPath } from '../../../common/utils/user-image-guard.util';
import { StoragePathResolver } from '../../../storage/services/storage-path-resolver.service';
import { BodyImageStorageService } from '../../body-analysis/services/body-image-storage.service';
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
  ) {
    this.userRepository = userRepository;
    this.storagePathResolver = storagePathResolver;
    this.bodyImageStorageService = bodyImageStorageService;
  }

  async resolveBodyImagePath(userId) {
    const user = await this.userRepository.findUserContext(userId);

    if (!user) {
      return null;
    }

    const preferences = user.profile?.preferences || {};
    const candidates = [
      user.profile?.body_image,
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

    const bodyPhotoUrl = this.storagePathResolver.toPublicUrl(bodyImagePath);

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
