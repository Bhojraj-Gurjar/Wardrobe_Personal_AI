import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { REFRESH_SOURCES } from '../../fashion-dna/constants/fashion-dna-regeneration.constants';
import { FashionDnaRegenerationService } from '../../fashion-dna/services/fashion-dna-regeneration.service';
import { formatCatalogProduct } from '../../products/utils/product-catalog.mapper';
import { OrdersRepository } from '../repositories/orders.repository';
import {
  isOrderCancellable,
  normalizeDisplayStatus,
  resolveStatusFilterValues,
} from '../utils/order-status.util';
import { ORDER_STATUS } from '../validators/order.constants';

export @Injectable()
class OrdersService {
  constructor(
    @Inject(OrdersRepository) ordersRepository,
    @Inject(FashionDnaRegenerationService) fashionDnaRegenerationService,
  ) {
    this.ordersRepository = ordersRepository;
    this.fashionDnaRegenerationService = fashionDnaRegenerationService;
  }

  updateExpiredOrders() {
    return this.ordersRepository.syncAutoStatuses();
  }

  async create(userId, dto) {
    if (dto.product_id) {
      const productExists = await this.ordersRepository.productExists(dto.product_id);

      if (!productExists) {
        throw new NotFoundException('Product not found');
      }
    }

    const order = await this.ordersRepository.create(userId, dto);

    this.fashionDnaRegenerationService.trigger(userId, REFRESH_SOURCES.PURCHASE);

    return this.formatOrder(order);
  }

  async createCheckoutOrder(userId, checkoutDto) {
    const productIds = checkoutDto.items.map((item) => item.product_id);
    const products = await this.ordersRepository.findProductsByIds(productIds);
    const productMap = new Map(products.map((product) => [product.id, product]));

    for (const item of checkoutDto.items) {
      if (!productMap.has(item.product_id)) {
        throw new NotFoundException(`Product not found: ${item.product_id}`);
      }
    }

    const lineItems = checkoutDto.items.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      product: formatCatalogProduct(productMap.get(item.product_id)),
    }));

    const order = await this.ordersRepository.create(userId, {
      order_number: checkoutDto.order_number,
      total_amount: checkoutDto.total_amount,
      subtotal: checkoutDto.subtotal,
      shipping: checkoutDto.shipping,
      discount: checkoutDto.discount,
      coupon_code: checkoutDto.coupon_code,
      product_id: checkoutDto.items[0]?.product_id || null,
      metadata: {
        items: lineItems,
        payment_status: 'simulated_success',
        payment_method: checkoutDto.payment_method || 'UPI',
      },
    });

    this.fashionDnaRegenerationService.trigger(userId, REFRESH_SOURCES.PURCHASE);

    return this.formatOrder(order);
  }

  async findAll(userId, query) {
    await this.ordersRepository.syncAutoStatuses();

    const [orders, total] = await this.ordersRepository.findManyByUserId(
      userId,
      query,
    );

    return {
      items: orders.map((order) => this.formatOrder(order)),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  async findOne(userId, id) {
    await this.ordersRepository.syncAutoStatuses();

    const order = await this.ordersRepository.findByIdAndUserId(id, userId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.formatOrder(order);
  }

  async cancel(userId, id) {
    const order = await this.ordersRepository.findByIdAndUserId(id, userId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!isOrderCancellable(order.status)) {
      throw new BadRequestException('Order cannot be cancelled');
    }

    const updated = await this.ordersRepository.updateStatus(
      id,
      ORDER_STATUS.CANCELLED,
    );

    return this.formatOrder(updated);
  }

  formatOrder(order) {
    const metadataItems = Array.isArray(order.metadata?.items)
      ? order.metadata.items
      : null;

    const items = metadataItems?.length
      ? metadataItems.map((item, index) => ({
        id: `${order.id}-${index}`,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        product: item.product || (order.product
          ? formatCatalogProduct(order.product)
          : null),
      }))
      : order.product
        ? [{
          id: `${order.id}-0`,
          product_id: order.product_id,
          quantity: 1,
          price: order.total_amount,
          product: formatCatalogProduct(order.product),
        }]
        : [];

    return {
      id: order.id,
      user_id: order.user_id,
      product_id: order.product_id ?? null,
      brand_id: order.product?.brand_id ?? null,
      order_number: order.order_number || `WA-${order.id.slice(0, 8).toUpperCase()}`,
      total_amount: order.total_amount,
      subtotal: order.subtotal ?? order.total_amount,
      shipping: order.shipping ?? 0,
      discount: order.discount ?? 0,
      coupon_code: order.coupon_code ?? null,
      status: order.status,
      display_status: normalizeDisplayStatus(order.status),
      can_cancel: isOrderCancellable(order.status),
      item_count: items.reduce((sum, item) => sum + (item.quantity || 1), 0),
      items,
      user: order.user
        ? {
          id: order.user.id,
          email: order.user.email,
          name: order.user.profile?.name || order.user.email,
        }
        : null,
      metadata: order.metadata ?? null,
      created_at: order.created_at,
      updated_at: order.updated_at,
    };
  }
}
