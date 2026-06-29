import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { REFRESH_SOURCES } from '../../fashion-dna/constants/fashion-dna-regeneration.constants';
import { FashionDnaRegenerationService } from '../../fashion-dna/services/fashion-dna-regeneration.service';
import { ProductService } from '../../products/services/product.service';
import { DEFAULT_CURRENCY } from '../../../common/utils/currency.util';
import { STOCK_EXCEEDED_ERROR, StockExceededError } from '../../commerce/utils/inventory.util';
import {
  estimateDeliveryDate,
  generateOmsOrderNumber,
} from '../../commerce/constants/commerce.constants';
import { StoragePathResolver } from '../../../storage/services/storage-path-resolver.service';
import { OrdersRepository } from '../repositories/orders.repository';
import { OrderEventService } from './order-event.service';
import {
  isOrderCancellable,
  normalizeDisplayStatus,
  resolveStatusFilterValues,
} from '../utils/order-status.util';
import {
  ORDER_EVENTS,
  ORDER_NOTIFICATION_TYPE,
  ORDER_STATUS,
  ORDER_TIMELINE_ACTION,
} from '../validators/order.constants';

export @Injectable()
class OrdersService {
  constructor(
    @Inject(OrdersRepository) ordersRepository,
    @Inject(FashionDnaRegenerationService) fashionDnaRegenerationService,
    @Inject(ProductService) productService,
    @Inject(OrderEventService) orderEventService,
    @Inject(StoragePathResolver) storagePathResolver,
  ) {
    this.ordersRepository = ordersRepository;
    this.fashionDnaRegenerationService = fashionDnaRegenerationService;
    this.productService = productService;
    this.orderEventService = orderEventService;
    this.storagePathResolver = storagePathResolver;
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

    let order;

    try {
      order = dto.product_id
        ? await this.ordersRepository.createWithInventoryReservation(
          userId,
          dto,
          [{ product_id: dto.product_id, quantity: 1 }],
        )
        : await this.ordersRepository.create(userId, dto);
    } catch (error) {
      if (error instanceof StockExceededError) {
        throw new BadRequestException(STOCK_EXCEEDED_ERROR);
      }

      throw error;
    }

    if (dto.product_id) {
      await this.productService.invalidateCatalogCache(dto.product_id);
    }

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

    const paymentMethod = checkoutDto.payment_method || 'COD';
    const paymentStatus = 'pending';

    let order;

    try {
      order = await this.ordersRepository.checkoutWithCartClear(
        userId,
        {
          order_number: checkoutDto.order_number,
          total_amount: checkoutDto.total_amount,
          subtotal: checkoutDto.subtotal,
          shipping: checkoutDto.shipping,
          discount: checkoutDto.discount,
          tax: checkoutDto.tax ?? 0,
          coupon_code: checkoutDto.coupon_code,
          product_id: checkoutDto.items[0]?.product_id || null,
          payment_method: paymentMethod,
          payment_status: paymentStatus,
          shipping_address: checkoutDto.shipping_address,
          billing_address: checkoutDto.billing_address || checkoutDto.shipping_address,
          estimated_delivery: checkoutDto.estimated_delivery || estimateDeliveryDate(),
          metadata: {
            items: lineItems,
            payment_reference: checkoutDto.payment_reference || null,
            payment_gateway: paymentMethod === 'COD' ? null : 'pending',
          },
          oms_metadata: {
            label_generated: false,
            invoice_generated: false,
          },
        },
        checkoutDto.items,
      );
    } catch (error) {
      if (error instanceof StockExceededError) {
        throw new BadRequestException(STOCK_EXCEEDED_ERROR);
      }

      if (error?.message === 'CART_EMPTY') {
        throw new BadRequestException('Cart is empty');
      }

      throw error;
    }

    await this.ordersRepository.createTimelineEntry({
      id: randomUUID(),
      order_id: order.id,
      action: ORDER_TIMELINE_ACTION.CREATED,
      from_status: null,
      to_status: ORDER_STATUS.CREATED,
      actor_id: userId,
      actor_role: 'CUSTOMER',
      notes: 'Order placed via checkout',
    });

    await this.ordersRepository.createNotification({
      id: randomUUID(),
      user_id: userId,
      order_id: order.id,
      type: ORDER_NOTIFICATION_TYPE.ORDER_PLACED,
      title: 'Order placed successfully',
      message: `Your order ${order.order_number} has been placed.`,
    });

    this.orderEventService.emit(ORDER_EVENTS.ORDER_CREATED, {
      userId,
      orderId: order.id,
      orderNumber: order.order_number,
      status: ORDER_STATUS.CREATED,
    });

    await Promise.all(
      [...new Set(checkoutDto.items.map((item) => item.product_id))].map((productId) =>
        this.productService.invalidateCatalogCache(productId),
      ),
    );

    this.fashionDnaRegenerationService.trigger(userId, REFRESH_SOURCES.PURCHASE);

    return this.formatOrder(order);
  }

  async findAll(userId, query) {
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

    const updated = await this.ordersRepository.cancelWithStockRestore(id, order.status);

    if (!updated) {
      throw new BadRequestException('Order status changed concurrently. Please refresh and retry.');
    }

    await this.ordersRepository.createTimelineEntry({
      id: randomUUID(),
      order_id: updated.id,
      action: ORDER_TIMELINE_ACTION.CANCELLED,
      from_status: order.status,
      to_status: ORDER_STATUS.CANCELLED,
      actor_id: userId,
      actor_role: 'CUSTOMER',
      notes: 'Cancelled by customer',
    });

    this.orderEventService.emit(ORDER_EVENTS.ORDER_CANCELLED, {
      userId,
      orderId: updated.id,
      orderNumber: updated.order_number,
    });

    await Promise.all(
      [...new Set(this.ordersRepository.getLineItemsFromOrder(updated).map((item) => item.product_id))].map(
        (productId) => this.productService.invalidateCatalogCache(productId),
      ),
    );

    return this.formatOrder(updated);
  }

  async getNotifications(userId, query = {}) {
    const items = await this.ordersRepository.findUserNotifications(userId, query);

    return {
      items: items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        message: item.message,
        is_read: item.is_read,
        order: item.order,
        created_at: item.created_at,
      })),
    };
  }

  async markNotificationsRead(userId, ids = null) {
    if (!Array.isArray(ids) || !ids.length) {
      throw new BadRequestException('Notification ids are required');
    }

    await this.ordersRepository.markNotificationsRead(userId, ids);
    return { success: true };
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

    const omsFlags = {
      label_generated: Boolean(order.label_generated_at || order.oms_metadata?.label_generated),
      invoice_generated: Boolean(order.invoice_generated_at || order.oms_metadata?.invoice_generated),
      packing_checklist: order.oms_metadata?.packing_checklist || null,
    };

    return {
      id: order.id,
      user_id: order.user_id,
      product_id: order.product_id ?? null,
      brand_id: order.product?.brand_id ?? null,
      order_number: order.order_number || `WA-${order.id.slice(0, 8).toUpperCase()}`,
      invoice_number: order.invoice_number ?? null,
      total_amount: order.total_amount,
      subtotal: order.subtotal ?? order.total_amount,
      shipping: order.shipping ?? 0,
      discount: order.discount ?? 0,
      tax: order.tax ?? 0,
      currency: DEFAULT_CURRENCY,
      coupon_code: order.coupon_code ?? null,
      payment_method: order.payment_method ?? order.metadata?.payment_method ?? 'COD',
      payment_status: order.payment_status ?? order.metadata?.payment_status ?? 'pending',
      shipping_address: order.shipping_address ?? order.metadata?.shipping_address ?? null,
      billing_address: order.billing_address ?? order.metadata?.billing_address ?? null,
      priority: order.priority ?? 'NORMAL',
      estimated_delivery: order.estimated_delivery ?? null,
      tracking_number: order.tracking_number ?? null,
      courier_name: order.courier_name ?? null,
      package_weight: order.package_weight ?? null,
      package_id: order.package_id ?? null,
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
          mobile: order.user.mobile,
        }
        : null,
      metadata: order.metadata ?? null,
      oms_metadata: order.oms_metadata ?? null,
      oms_flags: omsFlags,
      timeline: (order.timeline || []).map((entry) => ({
        id: entry.id,
        action: entry.action,
        from_status: entry.from_status,
        to_status: entry.to_status,
        actor_role: entry.actor_role,
        notes: entry.notes,
        created_at: entry.created_at,
      })),
      documents: (order.documents || []).map((doc) => ({
        id: doc.id,
        document_type: doc.document_type,
        file_name: doc.file_name,
        public_url: this.storagePathResolver.toPublicUrl(doc.storage_path),
        version: doc.version,
        created_at: doc.created_at,
      })),
      label_generated_at: order.label_generated_at,
      invoice_generated_at: order.invoice_generated_at,
      packed_at: order.packed_at,
      dispatched_at: order.dispatched_at,
      delivered_at: order.delivered_at,
      completed_at: order.completed_at,
      created_at: order.created_at,
      updated_at: order.updated_at,
    };
  }
}
