import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { OrdersRepository } from '../repositories/orders.repository';
import { OrdersService } from './orders.service';
import { OrderPdfService } from './order-pdf.service';
import { OrderEventService } from './order-event.service';
import { NotificationsService } from '../../notifications/notifications.service';
import {
  assertCanMoveToPacking,
  assertPackingChecklistComplete,
  assertValidStatusTransition,
  getOmsFlags,
} from '../utils/order-transition.util';
import {
  ORDER_DOCUMENT_TYPE,
  ORDER_EVENTS,
  ORDER_NOTIFICATION_TYPE,
  ORDER_STATUS,
  ORDER_TIMELINE_ACTION,
} from '../validators/order.constants';
import { generateOmsInvoiceNumber } from '../../commerce/constants/commerce.constants';

/** Hours after entering in-transit before auto-completion. */
const IN_TRANSIT_AUTO_COMPLETE_MS = 60 * 60 * 1000;

function isProductionEnvironment() {
  return process.env.NODE_ENV === 'production';
}

export @Injectable()
class OrderOmsService {
  constructor(
    @Inject(OrdersRepository) ordersRepository,
    @Inject(forwardRef(() => OrdersService)) ordersService,
    @Inject(OrderPdfService) orderPdfService,
    @Inject(OrderEventService) orderEventService,
    @Inject(NotificationsService) notificationsService,
  ) {
    this.ordersRepository = ordersRepository;
    this.ordersService = ordersService;
    this.orderPdfService = orderPdfService;
    this.orderEventService = orderEventService;
    this.notificationsService = notificationsService;
    this.logger = new Logger(OrderOmsService.name);
  }

  async getOrderOrThrow(id) {
    const order = await this.ordersRepository.findById(id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async recordTimeline(order, action, { fromStatus, toStatus, actorId, actorRole, notes, metadata } = {}) {
    return this.ordersRepository.createTimelineEntry({
      id: randomUUID(),
      order_id: order.id,
      action,
      from_status: fromStatus ?? order.status,
      to_status: toStatus ?? order.status,
      actor_id: actorId ?? null,
      actor_role: actorRole ?? 'ADMIN',
      notes: notes ?? null,
      metadata: metadata ?? null,
    });
  }

  async notifyCustomer(order, type, title, message, metadata = null) {
    if (!order.user_id) {
      return null;
    }

    const notification = await this.ordersRepository.createNotification({
      id: randomUUID(),
      user_id: order.user_id,
      order_id: order.id,
      type,
      title,
      message,
      metadata,
    });

    this.orderEventService.emit(ORDER_EVENTS.ORDER_NOTIFICATION_CREATED, {
      userId: order.user_id,
      orderId: order.id,
      orderNumber: order.order_number,
      notificationId: notification.id,
      type,
    });

    this.notificationsService.forwardOrderNotification(order.user_id, notification, order);

    return notification;
  }

  emitStatusUpdate(order, previousStatus) {
    this.orderEventService.emit(ORDER_EVENTS.ORDER_STATUS_UPDATED, {
      userId: order.user_id,
      orderId: order.id,
      orderNumber: order.order_number,
      status: order.status,
      previousStatus,
    });
  }

  async transitionOrder(order, toStatus, { actorId, notes, extra = {} } = {}) {
    assertValidStatusTransition(order.status, toStatus);

    const previousStatus = order.status;
    const updated = await this.ordersRepository.updateStatus(
      order.id,
      toStatus,
      extra,
      previousStatus,
    );

    if (!updated) {
      throw new BadRequestException('Order status changed concurrently. Please refresh and retry.');
    }

    await this.recordTimeline(updated, ORDER_TIMELINE_ACTION.STATUS_UPDATED, {
      fromStatus: previousStatus,
      toStatus,
      actorId,
      notes,
    });

    this.emitStatusUpdate(updated, previousStatus);

    return updated;
  }

  resolveDocumentErrorMessage(error) {
    return error?.message || String(error || 'Document generation failed');
  }

  logDocumentGenerationFailure(orderId, docType, error) {
    const message = this.resolveDocumentErrorMessage(error);

    if (isProductionEnvironment()) {
      this.logger.error(
        `OMS ${docType} generation failed | order=${orderId} | reason=${message}`,
      );
      return message;
    }

    this.logger.error(
      `OMS ${docType} generation failed | order=${orderId} | reason=${message}`,
      error?.stack,
    );
    return message;
  }

  async recordDocumentGenerationFailure(orderId, docType, message) {
    const order = await this.getOrderOrThrow(orderId);
    const errorKey = docType === 'invoice'
      ? 'invoice_generation_error'
      : 'label_generation_error';

    await this.ordersRepository.updateOrder(orderId, {
      oms_metadata: {
        ...(order.oms_metadata || {}),
        [errorKey]: message,
      },
    });
  }

  async tryGenerateInvoice(orderId, adminId, regenerate = false) {
    this.logger.log(`OMS accept | order=${orderId} | invoice generation requested`);

    try {
      const order = await this.generateInvoice(orderId, adminId, regenerate);
      this.logger.log(`OMS accept | order=${orderId} | invoice generation success`);
      return { ok: true, order };
    } catch (error) {
      const message = this.logDocumentGenerationFailure(orderId, 'invoice', error);
      await this.recordDocumentGenerationFailure(orderId, 'invoice', message);
      return { ok: false, error: message };
    }
  }

  async tryGenerateLabel(orderId, adminId, regenerate = false) {
    this.logger.log(`OMS accept | order=${orderId} | label generation requested`);

    try {
      const order = await this.generateLabel(orderId, adminId, regenerate);
      this.logger.log(`OMS accept | order=${orderId} | label generation success`);
      return { ok: true, order };
    } catch (error) {
      const message = this.logDocumentGenerationFailure(orderId, 'label', error);
      await this.recordDocumentGenerationFailure(orderId, 'label', message);
      return { ok: false, error: message };
    }
  }

  async acceptOrder(id, adminId, notes = null) {
    const order = await this.getOrderOrThrow(id);
    this.logger.log(`OMS accept triggered | order=${id} | status=${order.status}`);

    const updated = await this.transitionOrder(order, ORDER_STATUS.CONFIRMED, {
      actorId: adminId,
      notes,
    });

    await this.recordTimeline(updated, ORDER_TIMELINE_ACTION.ACCEPTED, {
      fromStatus: ORDER_STATUS.CREATED,
      toStatus: ORDER_STATUS.CONFIRMED,
      actorId: adminId,
      notes,
    });

    await this.notifyCustomer(
      updated,
      ORDER_NOTIFICATION_TYPE.ORDER_ACCEPTED,
      'Order accepted',
      `Your order ${updated.order_number} has been accepted and is being prepared.`,
    );

    this.logger.log(`OMS accept | order=${id} | status updated to CONFIRMED`);

    const [invoiceResult, labelResult] = await Promise.all([
      this.tryGenerateInvoice(id, adminId, false),
      this.tryGenerateLabel(id, adminId, false),
    ]);

    if (!invoiceResult.ok || !labelResult.ok) {
      this.logger.warn(
        `OMS accept | order=${id} | documents partial | invoice=${invoiceResult.ok ? 'ok' : 'failed'} | label=${labelResult.ok ? 'ok' : 'failed'}`,
      );
    } else {
      this.logger.log(`OMS accept | order=${id} | invoice and label generated`);
    }

    const fresh = await this.getOrderOrThrow(id);
    return this.ordersService.formatOrder(fresh);
  }

  async bulkAcceptOrders(orderIds = [], adminId) {
    if (!Array.isArray(orderIds) || !orderIds.length) {
      throw new BadRequestException('Select at least one order to accept.');
    }

    const uniqueOrderIds = [...new Set(orderIds.filter(Boolean))];
    this.logger.log(`OMS bulk accept triggered | count=${uniqueOrderIds.length}`);

    const results = await Promise.allSettled(
      uniqueOrderIds.map((orderId) => this.acceptOrder(orderId, adminId)),
    );

    const accepted = [];
    const errors = [];

    results.forEach((result, index) => {
      const orderId = uniqueOrderIds[index];

      if (result.status === 'fulfilled') {
        accepted.push(result.value);
        return;
      }

      const message = result.reason?.message || 'Failed to accept order';
      this.logger.error(
        `OMS bulk accept failed | order=${orderId} | reason=${message}`,
        isProductionEnvironment() ? undefined : result.reason?.stack,
      );
      errors.push({ id: orderId, message });
    });

    this.logger.log(
      `OMS bulk accept complete | accepted=${accepted.length} | failed=${errors.length}`,
    );

    return {
      accepted,
      errors,
      acceptedCount: accepted.length,
      errorCount: errors.length,
    };
  }

  async holdOrder(id, adminId, notes = null) {
    const order = await this.getOrderOrThrow(id);
    const previousStatus = order.status;
    const omsMetadata = {
      ...(order.oms_metadata || {}),
      hold_previous_status: previousStatus,
    };

    const updated = await this.transitionOrder(order, ORDER_STATUS.ON_HOLD, {
      actorId: adminId,
      notes,
      extra: { oms_metadata: omsMetadata },
    });

    await this.recordTimeline(updated, ORDER_TIMELINE_ACTION.ON_HOLD, {
      actorId: adminId,
      notes,
    });

    return this.ordersService.formatOrder(updated);
  }

  async generateInvoice(id, adminId, regenerate = false) {
    const order = await this.getOrderOrThrow(id);
    const formatted = this.ordersService.formatOrder(order);

    if (order.invoice_number && !regenerate) {
      throw new BadRequestException('Invoice already generated. Use regenerate to create a new version.');
    }

    const invoiceNumber = order.invoice_number || generateOmsInvoiceNumber();
    const pdf = await this.orderPdfService.generateAndStore(order, {
      ...formatted,
      invoice_number: invoiceNumber,
    }, ORDER_DOCUMENT_TYPE.INVOICE, adminId);

    const omsMetadata = {
      ...(order.oms_metadata || {}),
      invoice_generated: true,
      invoice_generation_error: null,
    };

    const updated = await this.ordersRepository.updateOrder(order.id, {
      invoice_number: invoiceNumber,
      invoice_generated_at: new Date(),
      oms_metadata: omsMetadata,
    });

    await this.ordersRepository.createDocument({
      id: randomUUID(),
      order_id: order.id,
      document_type: ORDER_DOCUMENT_TYPE.INVOICE,
      file_name: pdf.file_name,
      storage_path: pdf.storage_path,
      mime_type: pdf.mime_type,
      version: regenerate ? (order.documents?.filter((d) => d.document_type === ORDER_DOCUMENT_TYPE.INVOICE).length || 0) + 1 : 1,
      generated_by: adminId,
    });

    await this.recordTimeline(updated, ORDER_TIMELINE_ACTION.INVOICE_GENERATED, {
      actorId: adminId,
      metadata: { invoice_number: invoiceNumber, regenerate },
    });

    await this.notifyCustomer(
      updated,
      ORDER_NOTIFICATION_TYPE.INVOICE_GENERATED,
      'Invoice generated',
      `Invoice ${invoiceNumber} is ready for order ${updated.order_number}.`,
    );

    return this.ordersService.formatOrder(updated);
  }

  async generateLabel(id, adminId, regenerate = false) {
    const order = await this.getOrderOrThrow(id);
    const formatted = this.ordersService.formatOrder(order);
    const flags = getOmsFlags(order);

    if (flags.labelGenerated && !regenerate) {
      throw new BadRequestException('Label already generated. Use regenerate to create a new version.');
    }

    const packageId = order.package_id || `PKG-${order.order_number?.replace(/[^A-Z0-9]/gi, '') || order.id.slice(0, 8).toUpperCase()}`;
    const pdf = await this.orderPdfService.generateAndStore(order, {
      ...formatted,
      package_id: packageId,
    }, ORDER_DOCUMENT_TYPE.SHIPPING_LABEL, adminId);

    const omsMetadata = {
      ...(order.oms_metadata || {}),
      label_generated: true,
      label_generation_error: null,
    };

    const updated = await this.ordersRepository.updateOrder(order.id, {
      package_id: packageId,
      label_generated_at: new Date(),
      oms_metadata: omsMetadata,
    });

    await this.ordersRepository.createDocument({
      id: randomUUID(),
      order_id: order.id,
      document_type: ORDER_DOCUMENT_TYPE.SHIPPING_LABEL,
      file_name: pdf.file_name,
      storage_path: pdf.storage_path,
      mime_type: pdf.mime_type,
      version: regenerate ? (order.documents?.filter((d) => d.document_type === ORDER_DOCUMENT_TYPE.SHIPPING_LABEL).length || 0) + 1 : 1,
      generated_by: adminId,
    });

    await this.recordTimeline(updated, ORDER_TIMELINE_ACTION.LABEL_GENERATED, {
      actorId: adminId,
      metadata: { package_id: packageId, regenerate },
    });

    await this.notifyCustomer(
      updated,
      ORDER_NOTIFICATION_TYPE.LABEL_GENERATED,
      'Shipping label created',
      `Your order ${updated.order_number} is being prepared for dispatch.`,
    );

    return this.ordersService.formatOrder(updated);
  }

  async moveToPacking(id, adminId) {
    const order = await this.getOrderOrThrow(id);
    assertCanMoveToPacking(order);

    const updated = await this.transitionOrder(order, ORDER_STATUS.PACKING, { actorId: adminId });

    await this.recordTimeline(updated, ORDER_TIMELINE_ACTION.MOVED_TO_PACKING, { actorId: adminId });

    return this.ordersService.formatOrder(updated);
  }

  async updatePackingChecklist(id, adminId, checklist) {
    const order = await this.getOrderOrThrow(id);

    if (order.status !== ORDER_STATUS.PACKING) {
      throw new BadRequestException('Order must be in PACKING status');
    }

    const updated = await this.ordersRepository.updateOrder(order.id, {
      oms_metadata: {
        ...(order.oms_metadata || {}),
        packing_checklist: {
          ...(order.oms_metadata?.packing_checklist || {}),
          ...checklist,
        },
      },
    });

    return this.ordersService.formatOrder(updated);
  }

  async quickMarkRtd(id, adminId) {
    const order = await this.getOrderOrThrow(id);
    const defaultChecklist = {
      items_verified: true,
      packaging_type: 'Standard',
      quality_check: true,
      seal_package: true,
    };

    if (order.status === ORDER_STATUS.CONFIRMED) {
      await this.moveToPacking(id, adminId);
      await this.updatePackingChecklist(id, adminId, defaultChecklist);
      await this.markPacked(id, adminId);
      return this.markRtd(id, adminId, {});
    }

    if (order.status === ORDER_STATUS.PACKING) {
      await this.updatePackingChecklist(id, adminId, defaultChecklist);
      await this.markPacked(id, adminId);
      return this.markRtd(id, adminId, {});
    }

    if (order.status === ORDER_STATUS.PACKED) {
      return this.markRtd(id, adminId, {});
    }

    throw new BadRequestException('Order cannot be marked RTD from its current status.');
  }

  async markPacked(id, adminId, notes = null) {
    const order = await this.getOrderOrThrow(id);
    assertPackingChecklistComplete(order);

    const updated = await this.transitionOrder(order, ORDER_STATUS.PACKED, {
      actorId: adminId,
      notes,
      extra: { packed_at: new Date() },
    });

    await this.recordTimeline(updated, ORDER_TIMELINE_ACTION.PACKED, { actorId: adminId, notes });

    return this.ordersService.formatOrder(updated);
  }

  async markRtd(id, adminId, payload = {}) {
    const order = await this.getOrderOrThrow(id);
    const extra = {
      package_weight: payload.package_weight ?? order.package_weight,
    };

    const updated = await this.transitionOrder(order, ORDER_STATUS.READY_TO_DISPATCH, {
      actorId: adminId,
      notes: payload.notes,
      extra,
    });

    await this.recordTimeline(updated, ORDER_TIMELINE_ACTION.RTD, { actorId: adminId });

    await this.notifyCustomer(
      updated,
      ORDER_NOTIFICATION_TYPE.PACKED,
      'Order packed',
      'Your order is ready for dispatch.',
    );

    return this.ordersService.formatOrder(updated);
  }

  async dispatchOrder(id, adminId, payload = {}) {
    const order = await this.getOrderOrThrow(id);
    const dispatchableStatuses = [
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PACKING,
      ORDER_STATUS.PACKED,
      ORDER_STATUS.READY_TO_DISPATCH,
      ORDER_STATUS.READY_FOR_HANDOVER,
    ];

    if (!dispatchableStatuses.includes(order.status)) {
      throw new BadRequestException('Order cannot be dispatched from its current status.');
    }

    if (![ORDER_STATUS.READY_TO_DISPATCH, ORDER_STATUS.READY_FOR_HANDOVER].includes(order.status)) {
      await this.quickMarkRtd(id, adminId);
    }

    return this.markShipped(id, adminId, {
      courier_name: payload.courier_name ?? order.courier_name ?? 'Manual Courier',
      tracking_number: payload.tracking_number
        ?? order.tracking_number
        ?? `TRK-${order.order_number}`,
      ...payload,
    });
  }

  async markHandover(id, adminId, payload = {}) {
    const order = await this.getOrderOrThrow(id);

    const updated = await this.transitionOrder(order, ORDER_STATUS.READY_FOR_HANDOVER, {
      actorId: adminId,
      notes: payload.notes,
      extra: {
        courier_name: payload.courier_name ?? order.courier_name,
        tracking_number: payload.tracking_number ?? order.tracking_number,
      },
    });

    await this.recordTimeline(updated, ORDER_TIMELINE_ACTION.HANDOVER, {
      actorId: adminId,
      metadata: payload,
    });

    await this.notifyCustomer(
      updated,
      ORDER_NOTIFICATION_TYPE.HANDED_OVER,
      'Handed to courier',
      `Your order ${updated.order_number} has been handed to the courier.`,
    );

    return this.ordersService.formatOrder(updated);
  }

  async markShipped(id, adminId, payload = {}) {
    const order = await this.getOrderOrThrow(id);

    const now = new Date();
    const updated = await this.transitionOrder(order, ORDER_STATUS.SHIPPED, {
      actorId: adminId,
      notes: payload.notes,
      extra: {
        courier_name: payload.courier_name ?? order.courier_name,
        tracking_number: payload.tracking_number ?? order.tracking_number,
        dispatched_at: now,
        estimated_delivery: payload.estimated_delivery
          ? new Date(payload.estimated_delivery)
          : order.estimated_delivery,
        oms_metadata: {
          ...(order.oms_metadata || {}),
          in_transit_at: now.toISOString(),
          delivery_notes: payload.delivery_notes ?? order.oms_metadata?.delivery_notes,
          delay_reason: payload.delay_reason ?? null,
        },
      },
    });

    await this.recordTimeline(updated, ORDER_TIMELINE_ACTION.SHIPPED, {
      actorId: adminId,
      metadata: payload,
    });

    await this.notifyCustomer(
      updated,
      ORDER_NOTIFICATION_TYPE.SHIPPED,
      'Order in transit',
      'Your package is on the way.',
    );

    return this.ordersService.formatOrder(updated);
  }

  async markDelivered(id, adminId, notes = null) {
    return this.markCompleted(id, adminId, notes);
  }

  async markCompleted(id, adminId, notes = null) {
    const order = await this.getOrderOrThrow(id);

    if (![ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED].includes(order.status)) {
      throw new BadRequestException('Only in-transit orders can be completed');
    }

    const now = new Date();
    const updated = await this.transitionOrder(order, ORDER_STATUS.COMPLETED, {
      actorId: adminId,
      notes,
      extra: {
        completed_at: now,
        delivered_at: order.delivered_at || now,
      },
    });

    await this.recordTimeline(updated, ORDER_TIMELINE_ACTION.COMPLETED, {
      actorId: adminId,
      notes,
      metadata: { display_label: 'Delivered / Completed' },
    });

    await this.notifyCustomer(
      updated,
      ORDER_NOTIFICATION_TYPE.DELIVERED,
      'Order delivered',
      'Your order has been delivered successfully.',
    );

    return this.ordersService.formatOrder(updated);
  }

  async autoCompleteOrder(order) {
    if (order.status !== ORDER_STATUS.SHIPPED) {
      return null;
    }

    const now = new Date();
    const updated = await this.transitionOrder(order, ORDER_STATUS.COMPLETED, {
      extra: {
        completed_at: now,
        delivered_at: order.delivered_at || now,
      },
    });

    await this.recordTimeline(updated, ORDER_TIMELINE_ACTION.COMPLETED, {
      actorRole: 'SYSTEM',
      notes: 'Auto-completed after in-transit period',
      metadata: { display_label: 'Delivered / Completed', auto: true },
    });

    await this.notifyCustomer(
      updated,
      ORDER_NOTIFICATION_TYPE.DELIVERED,
      'Order delivered',
      'Your order has been delivered successfully.',
    );

    return updated;
  }

  async autoCompleteInTransitOrders() {
    const cutoff = new Date(Date.now() - IN_TRANSIT_AUTO_COMPLETE_MS);
    const orders = await this.ordersRepository.findShippedOrdersReadyForCompletion(cutoff);
    let completed = 0;

    for (const order of orders) {
      try {
        const result = await this.autoCompleteOrder(order);
        if (result) {
          completed += 1;
        }
      } catch {
        // Continue with remaining orders
      }
    }

    return completed;
  }

  async migrateHandoverOrdersToInTransit() {
    const legacyOrders = await this.ordersRepository.findOrdersByStatus(
      ORDER_STATUS.READY_FOR_HANDOVER,
    );

    if (!legacyOrders.length) {
      return 0;
    }

    const now = new Date();

    await Promise.all(
      legacyOrders.map((order) => this.ordersRepository.updateOrder(order.id, {
        status: ORDER_STATUS.SHIPPED,
        dispatched_at: order.dispatched_at || order.updated_at || now,
        oms_metadata: {
          ...(order.oms_metadata || {}),
          in_transit_at: (order.dispatched_at || order.updated_at || now).toISOString(),
          migrated_from_handover: true,
        },
      })),
    );

    return legacyOrders.length;
  }

  async cancelOrder(id, adminId, reason = null) {
    const order = await this.getOrderOrThrow(id);
    assertValidStatusTransition(order.status, ORDER_STATUS.CANCELLED);

    const updated = await this.ordersRepository.cancelWithStockRestore(id, order.status);

    if (!updated) {
      throw new BadRequestException('Order status changed concurrently. Please refresh and retry.');
    }

    await this.recordTimeline(updated, ORDER_TIMELINE_ACTION.CANCELLED, {
      actorId: adminId,
      notes: reason,
      fromStatus: order.status,
      toStatus: ORDER_STATUS.CANCELLED,
    });

    this.orderEventService.emit(ORDER_EVENTS.ORDER_CANCELLED, {
      userId: order.user_id,
      orderId: order.id,
      orderNumber: order.order_number,
    });

    await this.notifyCustomer(
      updated,
      ORDER_NOTIFICATION_TYPE.CANCELLED,
      'Order cancelled',
      `Your order ${updated.order_number} has been cancelled.`,
    );

    return this.ordersService.formatOrder(updated);
  }

  async addInternalNote(id, adminId, note) {
    const order = await this.getOrderOrThrow(id);
    const notes = [
      ...(order.oms_metadata?.internal_notes || []),
      { id: randomUUID(), text: note, admin_id: adminId, created_at: new Date().toISOString() },
    ];

    const updated = await this.ordersRepository.updateOrder(order.id, {
      oms_metadata: { ...(order.oms_metadata || {}), internal_notes: notes },
    });

    await this.recordTimeline(updated, ORDER_TIMELINE_ACTION.NOTE_ADDED, {
      actorId: adminId,
      notes: note,
    });

    return this.ordersService.formatOrder(updated);
  }

  async getOmsSummary() {
    const [
      statusCounts,
      todayCount,
      weeklyCount,
      todayRevenueAgg,
      revenueAgg,
      avgAgg,
    ] = await this.ordersRepository.getOmsAnalytics();
    const byStatus = Object.fromEntries(
      statusCounts.map((row) => [row.status, row._count.status]),
    );

    const newOrders = byStatus[ORDER_STATUS.CREATED] || 0;
    const accepted = byStatus[ORDER_STATUS.CONFIRMED] || 0;
    const packedRtd = (byStatus[ORDER_STATUS.PACKING] || 0)
      + (byStatus[ORDER_STATUS.PACKED] || 0)
      + (byStatus[ORDER_STATUS.READY_TO_DISPATCH] || 0);
    const legacyHandover = byStatus[ORDER_STATUS.READY_FOR_HANDOVER] || 0;
    const inTransit = (byStatus[ORDER_STATUS.SHIPPED] || 0) + legacyHandover;
    const completed = (byStatus[ORDER_STATUS.COMPLETED] || 0)
      + (byStatus[ORDER_STATUS.DELIVERED] || 0);

    return {
      today_orders: todayCount,
      weekly_orders: weeklyCount,
      today_revenue: todayRevenueAgg._sum.total_amount || 0,
      pending: newOrders,
      pending_actions: newOrders + accepted + (byStatus[ORDER_STATUS.PACKING] || 0),
      new_orders: newOrders,
      accepted,
      packed_rtd: packedRtd,
      processing: accepted + (byStatus[ORDER_STATUS.PACKING] || 0),
      rtd: (byStatus[ORDER_STATUS.PACKED] || 0) + (byStatus[ORDER_STATUS.READY_TO_DISPATCH] || 0),
      in_transit: inTransit,
      completed,
      cancelled: byStatus[ORDER_STATUS.CANCELLED] || 0,
      returned: byStatus[ORDER_STATUS.RETURNED] || 0,
      revenue: revenueAgg._sum.total_amount || 0,
      average_order_value: avgAgg._avg.total_amount || 0,
      by_status: byStatus,
    };
  }
}
