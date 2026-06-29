import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { StoragePathResolver } from '../../../storage/services/storage-path-resolver.service';
import { StorageService } from '../../../storage/services/storage.service';
import { UserMediaRepository } from '../repositories/user-media.repository';
import { USER_MEDIA_STATUS } from '../validators/user-media.constants';

export @Injectable()
class UserMediaService {
  constructor(
    @Inject(UserMediaRepository) userMediaRepository,
    @Inject(StoragePathResolver) storagePathResolver,
    @Inject(StorageService) storageService,
  ) {
    this.userMediaRepository = userMediaRepository;
    this.storagePathResolver = storagePathResolver;
    this.storageService = storageService;
  }

  formatMediaRecord(record) {
    if (!record) {
      return null;
    }

    const publicUrl = record.public_url
      || this.storagePathResolver.toPublicUrl(record.storage_path);

    return {
      id: record.id,
      userId: record.user_id,
      module: record.module,
      originalFileName: record.original_file_name,
      storedFileName: record.stored_file_name,
      storagePath: record.storage_path,
      publicUrl,
      thumbnailUrl: record.thumbnail_url || publicUrl,
      fileSize: record.file_size,
      width: record.width,
      height: record.height,
      mimeType: record.mime_type,
      uploadSource: record.upload_source,
      status: record.status,
      metadata: record.metadata,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    };
  }

  async registerMedia({
    userId,
    module,
    storagePath,
    mimeType = null,
    fileSize = null,
    originalFileName = null,
    storedFileName = null,
    uploadSource = null,
    metadata = null,
    thumbnailPath = null,
  }) {
    if (!userId || !module || !storagePath) {
      return null;
    }

    await this.userMediaRepository.archiveActiveByModule(userId, module);

    const publicUrl = this.storagePathResolver.toPublicUrl(storagePath);
    const thumbnailUrl = thumbnailPath
      ? this.storagePathResolver.toPublicUrl(thumbnailPath)
      : publicUrl;

    const record = await this.userMediaRepository.create({
      id: randomUUID(),
      user_id: userId,
      module,
      original_file_name: originalFileName,
      stored_file_name: storedFileName,
      storage_path: storagePath,
      public_url: publicUrl,
      thumbnail_url: thumbnailUrl,
      file_size: fileSize,
      mime_type: mimeType,
      upload_source: uploadSource,
      status: USER_MEDIA_STATUS.ACTIVE,
      metadata,
    });

    return this.formatMediaRecord(record);
  }

  async getLatestMedia(userId, module) {
    const record = await this.userMediaRepository.findLatestByModule(userId, module);
    return this.formatMediaRecord(record);
  }

  async getUserMediaBundle(userId) {
    const records = await this.userMediaRepository.findActiveByUserId(userId);
    const byModule = {};

    for (const record of records) {
      if (!byModule[record.module]) {
        byModule[record.module] = this.formatMediaRecord(record);
      }
    }

    return {
      items: records.map((record) => this.formatMediaRecord(record)),
      byModule,
    };
  }

  async getModuleHistory(userId, module, query = {}) {
    const records = await this.userMediaRepository.findHistoryByModule(userId, module, query);

    return {
      items: records.map((record) => this.formatMediaRecord(record)),
    };
  }

  async getMediaById(userId, mediaId) {
    const record = await this.userMediaRepository.findByIdForUser(userId, mediaId);

    if (!record) {
      throw new NotFoundException('Media not found');
    }

    return this.formatMediaRecord(record);
  }

  assertMediaOwnership(record, userId) {
    if (!record || record.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }
  }

  async resolvePublicUrlIfExists(storagePath) {
    if (!storagePath) {
      return null;
    }

    const exists = await this.storageService.storedFileExists(storagePath);

    if (!exists) {
      return null;
    }

    return this.storagePathResolver.toPublicUrl(storagePath);
  }
}
