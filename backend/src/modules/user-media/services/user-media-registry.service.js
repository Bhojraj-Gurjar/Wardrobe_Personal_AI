import { Inject, Injectable } from '@nestjs/common';
import { UserMediaService } from './user-media.service';
import { USER_MEDIA_MODULE } from '../validators/user-media.constants';

export @Injectable()
class UserMediaRegistryService {
  constructor(@Inject(UserMediaService) userMediaService) {
    this.userMediaService = userMediaService;
  }

  registerFacePhoto(userId, storagePath, { mimeType, fileSize, uploadSource } = {}) {
    return this.userMediaService.registerMedia({
      userId,
      module: USER_MEDIA_MODULE.FACE_REGISTRATION,
      storagePath,
      mimeType,
      fileSize,
      uploadSource: uploadSource || 'face_registration',
      storedFileName: storagePath?.split('/').pop() || null,
    });
  }

  registerBodyPhoto(userId, storagePath, { mimeType, fileSize, uploadSource } = {}) {
    return this.userMediaService.registerMedia({
      userId,
      module: USER_MEDIA_MODULE.BODY_ANALYSIS,
      storagePath,
      mimeType,
      fileSize,
      uploadSource: uploadSource || 'body_analysis',
      storedFileName: storagePath?.split('/').pop() || null,
    });
  }

  registerBodyTransparent(userId, storagePath, metadata = null) {
    return this.userMediaService.registerMedia({
      userId,
      module: USER_MEDIA_MODULE.BODY_TRANSPARENT,
      storagePath,
      mimeType: 'image/png',
      uploadSource: 'body_processing',
      metadata,
      storedFileName: storagePath?.split('/').pop() || null,
    });
  }

  registerAvatar(userId, storagePath, { mimeType, metadata } = {}) {
    return this.userMediaService.registerMedia({
      userId,
      module: USER_MEDIA_MODULE.AVATAR,
      storagePath,
      mimeType: mimeType || 'image/png',
      uploadSource: 'digital_avatar',
      metadata,
      storedFileName: storagePath?.split('/').pop() || null,
    });
  }

  registerTryOnResult(userId, storagePath, metadata = null) {
    return this.userMediaService.registerMedia({
      userId,
      module: USER_MEDIA_MODULE.VIRTUAL_TRYON,
      storagePath,
      mimeType: 'image/png',
      uploadSource: 'virtual_try_on',
      metadata,
      storedFileName: storagePath?.split('/').pop() || null,
    });
  }
}
