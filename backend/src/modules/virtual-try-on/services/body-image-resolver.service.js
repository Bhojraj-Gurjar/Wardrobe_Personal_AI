import { Inject, Injectable } from '@nestjs/common';
import { StoragePathResolver } from '../../../storage/services/storage-path-resolver.service';
import { BodyImageStorageService } from '../../body-analysis/services/body-image-storage.service';
import {
  resolveOriginalBodyImagePath,
  resolveTransparentBodyImagePath,
} from '../../body-analysis/utils/body-photo-display.util';
import { VirtualTryOnRepository } from '../virtual-try-on.repository';
import { BackgroundRemovalService } from './background-removal.service';

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
    @Inject(BackgroundRemovalService) backgroundRemovalService,
  ) {
    this.repository = repository;
    this.storagePathResolver = storagePathResolver;
    this.bodyImageStorageService = bodyImageStorageService;
    this.backgroundRemovalService = backgroundRemovalService;
  }

  async getUserImageContext(userId) {
    return this.repository.findUserContext(userId);
  }

  async resolveBodyImagePath(userId) {
    const user = await this.getUserImageContext(userId);

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
    const user = await this.getUserImageContext(userId);

    if (!user) {
      return null;
    }

    const transparentPath = await this.resolveTransparentBodyImagePath(userId);

    if (transparentPath) {
      return transparentPath;
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

  async resolveAiBodyImagePath(userId) {
    const transparentPath = await this.resolveTransparentBodyImagePath(userId);

    if (transparentPath) {
      return transparentPath;
    }

    return this.resolveBodyImagePath(userId);
  }

  async resolveTransparentBodyImagePath(userId) {
    const user = await this.getUserImageContext(userId);

    if (!user) {
      return null;
    }

    const transparentPath = resolveTransparentBodyImagePath(
      userId,
      user.profile?.preferences || {},
    );

    if (!transparentPath || !this.backgroundRemovalService.transparentPngExists(userId)) {
      return null;
    }

    return transparentPath;
  }

  async syncTryOnSessionInput(userId) {
    const bodyImagePath = await this.resolveBodyImagePath(userId);
    const displayPath = await this.resolveDisplayBodyImagePath(userId);

    if (!bodyImagePath) {
      return null;
    }

    await this.repository.upsertSession(userId, {
      body_image: bodyImagePath,
      transparent_image: await this.resolveTransparentBodyImagePath(userId),
    });

    return {
      tryOnInputImage: bodyImagePath,
      tryOnInputImageUrl: this.storagePathResolver.toPublicUrl(bodyImagePath),
      bodyImage: bodyImagePath,
      bodyImageUrl: this.storagePathResolver.toPublicUrl(displayPath || bodyImagePath),
      displayBodyImageUrl: this.storagePathResolver.toPublicUrl(displayPath || bodyImagePath),
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
