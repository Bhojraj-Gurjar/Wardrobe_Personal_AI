import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

export @Injectable()
class StoragePathResolver {
  constructor(
    @Inject(ConfigService) configService,
    @Inject(StorageService) storageService,
  ) {
    this.publicBaseUrl = configService.get('storage.local.publicBaseUrl');
    this.storageService = storageService;
  }

  toPublicUrl(storagePath) {
    return this.storageService.resolvePublicUrl(storagePath);
  }
}
