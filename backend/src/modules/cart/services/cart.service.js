import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProductInteractionService } from '../../recommendations/services/product-interaction.service';
import { OrdersService } from '../../orders/services/orders.service';
import { OrderAddressService } from '../../orders/services/order-address.service';
import { FashionDnaRegenerationService } from '../../fashion-dna/services/fashion-dna-regeneration.service';
import { REFRESH_SOURCES } from '../../fashion-dna/constants/fashion-dna-regeneration.constants';
import { calculateCartTotals, estimateDeliveryDate, generateOmsOrderNumber } from '../../commerce/constants/commerce.constants';
import {
  resolveProductAvailableStock,
  STOCK_EXCEEDED_ERROR,
} from '../../commerce/utils/inventory.util';
import { formatCatalogProduct } from '../../products/utils/product-catalog.mapper';
import { CartRepository } from '../repositories/cart.repository';

export @Injectable()
class CartService {
  constructor(
    @Inject(CartRepository) cartRepository,
    @Inject(ProductInteractionService) productInteractionService,
    @Inject(OrdersService) ordersService,
    @Inject(OrderAddressService) orderAddressService,
    @Inject(FashionDnaRegenerationService) fashionDnaRegenerationService,
  ) {
    this.cartRepository = cartRepository;
    this.productInteractionService = productInteractionService;
    this.ordersService = ordersService;
    this.orderAddressService = orderAddressService;
    this.fashionDnaRegenerationService = fashionDnaRegenerationService;
  }

  triggerFashionDnaRefresh(userId) {
    this.fashionDnaRegenerationService.trigger(userId, REFRESH_SOURCES.CART_UPDATE);
  }

  assertQuantityWithinStock(quantity, product) {
    const available = resolveProductAvailableStock(product);

    if (quantity > available) {
      throw new BadRequestException(STOCK_EXCEEDED_ERROR);
    }
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

    const nextQuantity = existing
      ? existing.quantity + (dto.quantity || 1)
      : (dto.quantity || 1);

    this.assertQuantityWithinStock(nextQuantity, product);

    let item;

    if (existing) {
      item = await this.cartRepository.updateQuantity(
        existing.id,
        nextQuantity,
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
    this.triggerFashionDnaRefresh(userId);
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

    this.assertQuantityWithinStock(quantity, item.product);

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
    this.triggerFashionDnaRefresh(userId);
    return this.buildCartResponse(items);
  }

  async checkout(userId, checkoutDto = {}) {
    const items = await this.cartRepository.findByUserId(userId);

    if (!items.length) {
      throw new BadRequestException('Cart is empty');
    }

    const couponCode = checkoutDto.coupon_code || null;
    const cart = this.buildCartResponse(items, couponCode);

    let shippingAddress = checkoutDto.shipping_address || null;

    if (checkoutDto.address_id) {
      const saved = await this.orderAddressService.list(userId);
      const match = saved.find((address) => address.id === checkoutDto.address_id);

      if (!match) {
        throw new BadRequestException('Selected address not found');
      }

      shippingAddress = this.orderAddressService.toOrderAddressSnapshot(match);
    }

    if (!shippingAddress) {
      throw new BadRequestException('Shipping address is required for checkout');
    }

    const billingAddress = checkoutDto.billing_address
      || shippingAddress;

    const tax = Math.round((cart.summary.subtotal - (cart.summary.discount || 0)) * 0.05 * 100) / 100;

    const order = await this.ordersService.createCheckoutOrder(userId, {
      order_number: generateOmsOrderNumber(),
      total_amount: cart.summary.total + tax,
      subtotal: cart.summary.subtotal,
      shipping: cart.summary.shipping,
      discount: cart.summary.discount,
      tax,
      coupon_code: cart.summary.appliedCoupon,
      payment_method: checkoutDto.payment_method || 'COD',
      payment_reference: checkoutDto.payment_reference || null,
      shipping_address: shippingAddress,
      billing_address: billingAddress,
      estimated_delivery: estimateDeliveryDate(),
      items: cart.items.map((line) => ({
        product_id: line.product_id,
        quantity: line.quantity,
        price: line.price,
      })),
    });

    return {
      order,
      orders: [order],
      summary: {
        ...cart.summary,
        tax,
        total: cart.summary.total + tax,
        estimated_delivery: order.estimated_delivery,
      },
      item_count: cart.item_count,
    };
  }

  buildCartResponse(items, couponCode = null, lastTouched = null) {
    const lineItems = items.map((item) => {
      const availableStock = resolveProductAvailableStock(item.product);

      return {
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product?.price ?? 0,
        availableStock,
        product: formatCatalogProduct(item.product),
      };
    });

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
