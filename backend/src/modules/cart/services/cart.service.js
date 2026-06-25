import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductInteractionService } from '../../recommendations/services/product-interaction.service';
import { OrdersService } from '../../orders/services/orders.service';
import { calculateCartTotals, generateOrderNumber } from '../../commerce/constants/commerce.constants';
import { formatCatalogProduct } from '../../products/utils/product-catalog.mapper';
import { CartRepository } from '../repositories/cart.repository';

export @Injectable()
class CartService {
  constructor(
    @Inject(CartRepository) cartRepository,
    @Inject(ProductInteractionService) productInteractionService,
    @Inject(OrdersService) ordersService,
  ) {
    this.cartRepository = cartRepository;
    this.productInteractionService = productInteractionService;
    this.ordersService = ordersService;
  }

  async getCart(userId, couponCode = null) {
    const items = await this.cartRepository.findByUserId(userId);
    return this.buildCartResponse(items, couponCode);
  }

  async addItem(userId, dto) {
    const product = await this.cartRepository.productExists(dto.product_id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const existing = await this.cartRepository.findByUserAndProduct(
      userId,
      dto.product_id,
    );

    let item;

    if (existing) {
      item = await this.cartRepository.updateQuantity(
        existing.id,
        existing.quantity + (dto.quantity || 1),
      );
    } else {
      item = await this.cartRepository.create(
        userId,
        dto.product_id,
        dto.quantity || 1,
      );
      await this.productInteractionService.recordInteraction(
        userId,
        dto.product_id,
        'view',
      );
    }

    const items = await this.cartRepository.findByUserId(userId);
    return this.buildCartResponse(items, dto.coupon_code || null, item);
  }

  async updateQuantity(userId, id, quantity) {
    const item = await this.cartRepository.findByIdAndUserId(id, userId);

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    if (quantity < 1) {
      throw new BadRequestException('Minimum quantity is 1');
    }

    await this.cartRepository.updateQuantity(id, quantity);
    const items = await this.cartRepository.findByUserId(userId);
    return this.buildCartResponse(items);
  }

  async removeItem(userId, id) {
    const item = await this.cartRepository.findByIdAndUserId(id, userId);

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartRepository.delete(id);
    const items = await this.cartRepository.findByUserId(userId);
    return this.buildCartResponse(items);
  }

  async checkout(userId, couponCode = null) {
    const items = await this.cartRepository.findByUserId(userId);

    if (!items.length) {
      throw new BadRequestException('Cart is empty');
    }

    const cart = this.buildCartResponse(items, couponCode);

    const order = await this.ordersService.createCheckoutOrder(userId, {
      order_number: generateOrderNumber(),
      total_amount: cart.summary.total,
      subtotal: cart.summary.subtotal,
      shipping: cart.summary.shipping,
      discount: cart.summary.discount,
      coupon_code: cart.summary.appliedCoupon,
      items: cart.items.map((line) => ({
        product_id: line.product_id,
        quantity: line.quantity,
        price: line.price,
      })),
    });

    await this.cartRepository.clearUserCart(userId);

    return {
      order,
      orders: [order],
      summary: cart.summary,
      item_count: cart.item_count,
    };
  }

  buildCartResponse(items, couponCode = null, lastTouched = null) {
    const lineItems = items.map((item) => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.product?.price ?? 0,
      product: formatCatalogProduct(item.product),
    }));

    const totals = calculateCartTotals(
      lineItems.map((item) => ({
        price: item.price,
        quantity: item.quantity,
      })),
      couponCode,
    );

    return {
      items: lineItems,
      summary: totals,
      item_count: lineItems.reduce((sum, item) => sum + item.quantity, 0),
      last_touched_id: lastTouched?.id || null,
    };
  }
}
