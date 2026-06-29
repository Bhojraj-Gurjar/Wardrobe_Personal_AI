import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/products.module';
import { DatabaseModule } from '../../database/database.module';
import { StorageModule } from '../../storage/storage.module';
import { TryOnService } from './try-on.service';
import { TryOnUploadService } from './try-on-upload.service';
import { TryOnHistoryRepository } from './try-on-history.repository';

export @Module({
  imports: [
    AuthModule,
    DatabaseModule,
    StorageModule,
    ProductsModule,
    HttpModule.register({
      timeout: 65000,
    }),
  ],
  providers: [TryOnService, TryOnUploadService, TryOnHistoryRepository],
  exports: [TryOnService, TryOnUploadService],
})
class TryOnModule {}
