import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { FashionDnaModule } from '../fashion-dna/fashion-dna.module';
import { OrdersController } from './controllers/orders.controller';
import { OrdersService } from './services/orders.service';
import { OrderLifecycleService } from './services/order-lifecycle.service';
import { OrdersRepository } from './repositories/orders.repository';

export @Module({
  imports: [AuthModule, FashionDnaModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderLifecycleService, OrdersRepository],
  exports: [OrdersService, OrdersRepository],
})
class OrdersModule {}
