import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FaceModule } from '../face/face.module';
import { OrdersModule } from '../orders/orders.module';
import { ProductsModule } from '../products/products.module';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './services/admin.service';
import { AdminBootstrapService } from './services/admin-bootstrap.service';
import { AdminProductCmsService } from './services/admin-product-cms.service';
import { AdminProductBulkService } from './services/admin-product-bulk.service';
import { AdminRepository } from './repositories/admin.repository';
import { AdminAnalyticsRepository } from './repositories/admin-analytics.repository';
import { AdminProductCmsRepository } from './repositories/admin-product-cms.repository';

export @Module({
  imports: [AuthModule, FaceModule, OrdersModule, ProductsModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminBootstrapService,
    AdminProductCmsService,
    AdminProductBulkService,
    AdminRepository,
    AdminAnalyticsRepository,
    AdminProductCmsRepository,
  ],
  exports: [AdminService, AdminProductCmsService],
})
class AdminModule {}
