import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ProductsModule } from '../products/products.module';
import { BodyAnalysisModule } from '../body-analysis/body-analysis.module';
import { TryOnModule } from '../try-on/try-on.module';
import { VirtualTryOnController } from './virtual-try-on.controller';
import { VirtualTryOnService } from './virtual-try-on.service';
import { VirtualTryOnRepository } from './virtual-try-on.repository';
import { BodyImageResolverService } from './services/body-image-resolver.service';
import { BackgroundRemovalService } from './services/background-removal.service';

export @Module({
  imports: [AiModule, ProductsModule, BodyAnalysisModule, TryOnModule],
  controllers: [VirtualTryOnController],
  providers: [
    VirtualTryOnService,
    VirtualTryOnRepository,
    BodyImageResolverService,
    BackgroundRemovalService,
  ],
  exports: [VirtualTryOnService, BodyImageResolverService],
})
class VirtualTryOnModule {}
