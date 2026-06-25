import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from '../auth/auth.module';
import { BodyAnalysisModule } from '../body-analysis/body-analysis.module';
import { ProductsModule } from '../products/products.module';
import { DatabaseModule } from '../../database/database.module';
import { StorageModule } from '../../storage/storage.module';
import { TryOnController } from './try-on.controller';
import { TryOnService } from './try-on.service';
import { TryOnUploadService } from './try-on-upload.service';
import { TryOnHistoryRepository } from './try-on-history.repository';
import { TryOnResultRepository } from './repositories/try-on-result.repository';
import { TryOnUserRepository } from './repositories/try-on-user.repository';
import { TryOnBodyResolverService } from './services/try-on-body-resolver.service';
import { TryOnStudioService } from './services/try-on-studio.service';

export @Module({
  imports: [
    AuthModule,
    DatabaseModule,
    StorageModule,
    BodyAnalysisModule,
    ProductsModule,
    HttpModule.register({
      timeout: 65000,
    }),
  ],
  controllers: [TryOnController],
  providers: [
    TryOnService,
    TryOnUploadService,
    TryOnHistoryRepository,
    TryOnResultRepository,
    TryOnUserRepository,
    TryOnBodyResolverService,
    TryOnStudioService,
  ],
  exports: [TryOnService, TryOnUploadService, TryOnStudioService],
})
class TryOnModule {}