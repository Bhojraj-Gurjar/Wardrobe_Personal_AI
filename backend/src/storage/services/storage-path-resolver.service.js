import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { resolvePublicAssetUrl } from '../utils/storage-path.util';

export @Injectable()
class StoragePathResolver {
  constructor(@Inject(ConfigService) configService) {
    this.publicBaseUrl = configService.get('storage.local.publicBaseUrl');
  }

  toPublicUrl(storagePath) {
    return resolvePublicAssetUrl(storagePath, this.publicBaseUrl);
  }
}
