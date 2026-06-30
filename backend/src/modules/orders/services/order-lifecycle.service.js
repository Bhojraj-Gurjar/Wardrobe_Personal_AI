import { Inject, Injectable, Logger } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderOmsService } from './order-oms.service';
import { OrdersRepository } from '../repositories/orders.repository';

const AUTO_COMPLETE_INTERVAL_MS = 60 * 1000;

export @Injectable()
class OrderLifecycleService {
  constructor(
    @Inject(OrdersService) ordersService,
    @Inject(OrderOmsService) orderOmsService,
    @Inject(OrdersRepository) ordersRepository,
  ) {
    this.ordersService = ordersService;
    this.orderOmsService = orderOmsService;
    this.ordersRepository = ordersRepository;
    this.logger = new Logger(OrderLifecycleService.name);
    this.autoCompleteTimer = null;
  }

  async onModuleInit() {
    try {
      const migratedHandover = await this.orderOmsService.migrateHandoverOrdersToInTransit();
      if (migratedHandover > 0) {
        this.logger.log(`Migrated ${migratedHandover} legacy handover orders to in transit`);
      }
    } catch (error) {
      this.logger.warn(`Handover order migration skipped: ${error.message}`);
    }

    try {
      await this.ordersService.updateExpiredOrders();
    } catch {
      // Non-blocking startup sync
    }

    try {
      const migrated = await this.ordersRepository.migrateDeliveredOrdersToCompleted();
      if (migrated > 0) {
        this.logger.log(`Migrated ${migrated} legacy DELIVERED orders to COMPLETED`);
      }
    } catch (error) {
      this.logger.warn(`Delivered order migration skipped: ${error.message}`);
    }

    this.autoCompleteTimer = setInterval(() => {
      this.orderOmsService.autoCompleteInTransitOrders()
        .then((count) => {
          if (count > 0) {
            this.logger.log(`Auto-completed ${count} in-transit orders`);
          }
        })
        .catch((error) => {
          this.logger.warn(`In-transit auto-completion failed: ${error.message}`);
        });
    }, AUTO_COMPLETE_INTERVAL_MS);
  }

  onModuleDestroy() {
    if (this.autoCompleteTimer) {
      clearInterval(this.autoCompleteTimer);
      this.autoCompleteTimer = null;
    }
  }
}
