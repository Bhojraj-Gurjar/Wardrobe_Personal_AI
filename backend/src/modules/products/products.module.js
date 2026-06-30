import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ProductController } from './controllers/product.controller';
import { ProductCategoryController } from './controllers/product-category.controller';
import { ProductService } from './services/product.service';
import { ProductCategoryService } from './services/product-category.service';
import { ProductRepository } from './repositories/product.repository';
import { ProductCategoryRepository } from './repositories/product-category.repository';

export @Module({
  imports: [AiModule],
  controllers: [ProductCategoryController, ProductController],
  providers: [
    ProductService,
    ProductCategoryService,
    ProductRepository,
    ProductCategoryRepository,
  ],
  exports: [
    ProductService,
    ProductCategoryService,
    ProductRepository,
    ProductCategoryRepository,
  ],
})
class ProductsModule {}
