import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrdersModule } from '../orders/orders.module';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { CartController } from './controllers/cart.controller';
import { CartService } from './services/cart.service';
import { CartRepository } from './repositories/cart.repository';

export @Module({
  imports: [AuthModule, OrdersModule, forwardRef(() => RecommendationsModule)],
  controllers: [CartController],
  providers: [CartService, CartRepository],
  exports: [CartService, CartRepository],
})
class CartModule {}
