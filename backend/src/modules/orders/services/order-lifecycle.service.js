import { Inject, Injectable } from '@nestjs/common';
import { OrdersService } from './orders.service';

export @Injectable()
class OrderLifecycleService {
  constructor(@Inject(OrdersService) ordersService) {
    this.ordersService = ordersService;
  }

  async onModuleInit() {
    try {
      await this.ordersService.updateExpiredOrders();
    } catch {
      // Non-blocking startup sync
    }
  }
}
