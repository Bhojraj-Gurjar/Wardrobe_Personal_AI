import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FashionDnaModule } from '../fashion-dna/fashion-dna.module';
import { ProductsModule } from '../products/products.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersController } from './controllers/orders.controller';
import { OrderAddressController } from './controllers/order-address.controller';
import { AdminOmsController } from './controllers/admin-oms.controller';
import { OrdersService } from './services/orders.service';
import { OrderOmsService } from './services/order-oms.service';
import { OrderAddressService } from './services/order-address.service';
import { OrderPdfService } from './services/order-pdf.service';
import { OrderEventService } from './services/order-event.service';
import { OrderLifecycleService } from './services/order-lifecycle.service';
import { OrdersRepository } from './repositories/orders.repository';

export @Module({
  imports: [AuthModule, FashionDnaModule, ProductsModule, NotificationsModule],
  controllers: [OrdersController, OrderAddressController, AdminOmsController],
  providers: [
    OrdersService,
    OrderOmsService,
    OrderAddressService,
    OrderPdfService,
    OrderEventService,
    OrderLifecycleService,
    OrdersRepository,
  ],
  exports: [
    OrdersService,
    OrderOmsService,
    OrderAddressService,
    OrderEventService,
    OrdersRepository,
  ],
})
class OrdersModule {}
