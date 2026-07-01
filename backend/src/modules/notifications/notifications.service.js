import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NotificationsRepository } from './notifications.repository';
import { NotificationEventService } from './notification-event.service';
import {
  APP_NOTIFICATION_TYPES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_EVENTS,
} from './notifications.constants';
import {
  mapAppNotification,
  mapOrderNotification,
  mapSupportNotification,
  matchesCategory,
  matchesSearch,
  parseNotificationId,
} from './utils/notification-mapper.util';

export @Injectable()
class NotificationsService {
  constructor(
    @Inject(NotificationsRepository) repository,
    @Inject(NotificationEventService) notificationEventService,
  ) {
    this.repository = repository;
    this.notificationEventService = notificationEventService;
    this.logger = new Logger(NotificationsService.name);
  }

  async list(userId, query = {}) {
    const page = Math.max(Number.parseInt(String(query.page ?? 1), 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(String(query.limit ?? 20), 10) || 20, 1), 50);
    const category = query.category ? String(query.category).toUpperCase() : 'ALL';
    const search = query.search ? String(query.search).trim() : '';
    const unreadOnly = String(query.unreadOnly || '').toLowerCase() === 'true';
    const fetchLimit = Math.min(limit * page, 200);

    const [orders, support, app] = await Promise.all([
      category === 'ALL' || category === 'ORDERS'
        ? this.repository.findOrderNotifications(userId, { limit: fetchLimit, unreadOnly })
        : [],
      category === 'ALL' || category === 'SUPPORT'
        ? this.repository.findSupportNotifications(userId, { limit: fetchLimit, unreadOnly })
        : [],
      category === 'ALL' || !['ORDERS', 'SUPPORT'].includes(category)
        ? this.repository.findAppNotifications(userId, {
          limit: fetchLimit,
          unreadOnly,
          category: ['ORDERS', 'SUPPORT'].includes(category) ? null : category,
        })
        : [],
    ]);

    const merged = [
      ...orders.map(mapOrderNotification),
      ...support.map(mapSupportNotification),
      ...app.map(mapAppNotification),
    ]
      .filter((item) => matchesCategory(item, category))
      .filter((item) => matchesSearch(item, search))
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

    const total = merged.length;
    const start = (page - 1) * limit;
    const items = merged.slice(start, start + limit);
    const unreadCount = await this.getUnreadCount(userId);

    return {
      items,
      unreadCount,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getUnreadCount(userId) {
    const [orders, support, app] = await Promise.all([
      this.repository.countUnreadOrders(userId),
      this.repository.countUnreadSupport(userId),
      this.repository.countUnreadApp(userId),
    ]);

    return orders + support + app;
  }

  async markRead(userId, compositeIds = []) {
    if (!Array.isArray(compositeIds) || !compositeIds.length) {
      throw new BadRequestException('Notification ids are required');
    }

    const orderIds = [];
    const supportIds = [];
    const appIds = [];

    compositeIds.forEach((compositeId) => {
      const parsed = parseNotificationId(compositeId);

      if (!parsed) {
        return;
      }

      if (parsed.domain === 'order') {
        orderIds.push(parsed.id);
      } else if (parsed.domain === 'support') {
        supportIds.push(parsed.id);
      } else if (parsed.domain === 'app') {
        appIds.push(parsed.id);
      }
    });

    await Promise.all([
      orderIds.length ? this.repository.markOrdersRead(userId, orderIds) : null,
      supportIds.length ? this.repository.markSupportRead(userId, supportIds) : null,
      appIds.length ? this.repository.markAppRead(userId, appIds) : null,
    ]);

    return { success: true, unreadCount: await this.getUnreadCount(userId) };
  }

  async markAllRead(userId) {
    await Promise.all([
      this.repository.markAllOrdersRead(userId),
      this.repository.markAllSupportRead(userId),
      this.repository.markAllAppRead(userId),
    ]);

    return { success: true, unreadCount: 0 };
  }

  async createAppNotification({
    userId,
    category,
    type,
    title,
    description = null,
    actionPath = null,
    entityType = null,
    entityId = null,
    metadata = null,
    emitRealtime = true,
    adminBroadcast = false,
  }) {
    const record = await this.repository.createAppNotification({
      id: randomUUID(),
      user_id: userId,
      category,
      type,
      title,
      description,
      action_path: actionPath,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });

    const formatted = mapAppNotification(record);

    if (emitRealtime) {
      if (adminBroadcast || category === NOTIFICATION_CATEGORIES.ADMIN) {
        this.notificationEventService.emitToAdmin(formatted);
      }

      this.notificationEventService.emitToUser(userId, formatted);
    }

    return formatted;
  }

  async notifyAdmins(payload) {
    const admins = await this.repository.findAdminUsers();

    if (!admins.length) {
      return [];
    }

    return Promise.all(
      admins.map((admin) => this.createAppNotification({
        userId: admin.id,
        category: NOTIFICATION_CATEGORIES.ADMIN,
        ...payload,
      })),
    );
  }

  async notifyVirtualTryOnCompleted(userId, resultId, productName = null) {
    return this.createAppNotification({
      userId,
      category: NOTIFICATION_CATEGORIES.SHOPPING,
      type: APP_NOTIFICATION_TYPES.VIRTUAL_TRY_ON_COMPLETED,
      title: 'Virtual Try-On completed',
      description: productName
        ? `Your try-on for ${productName} is ready.`
        : 'Your virtual try-on result is ready.',
      actionPath: '/virtual-try-on',
      entityType: 'try_on_result',
      entityId: resultId,
      metadata: { resultId },
    });
  }

  async notifyProfileEvent(userId, type, title, description, actionPath = '/profile') {
    return this.createAppNotification({
      userId,
      category: NOTIFICATION_CATEGORIES.PROFILE,
      type,
      title,
      description,
      actionPath,
    });
  }

  async notifyAdminNewOrder(order) {
    const admins = await this.repository.findAdminUsers();

    if (!admins.length || !order?.id) {
      return [];
    }

    const customerName = order.user?.profile?.name
      || order.user?.email?.split('@')[0]
      || 'A customer';

    return Promise.all(
      admins.map((admin) => this.createAppNotification({
        userId: admin.id,
        category: NOTIFICATION_CATEGORIES.ORDERS,
        type: APP_NOTIFICATION_TYPES.ADMIN_NEW_ORDER,
        title: 'New order received',
        description: `${customerName} placed Order #${order.order_number}`,
        actionPath: `/admin/orders?order=${order.id}`,
        entityType: 'order',
        entityId: order.id,
        metadata: {
          type: 'NEW_ORDER',
          orderId: order.id,
          orderNumber: order.order_number,
          customerId: order.user_id,
          customerName,
          amount: order.total_amount,
          priority: 'high',
        },
      })),
    );
  }

  forwardOrderNotification(userId, notification, order = null) {
    const formatted = mapOrderNotification({
      ...notification,
      order: order || notification.order,
    });
    this.notificationEventService.emitToUser(userId, formatted);
    return formatted;
  }

  forwardSupportNotification(userId, notification, ticket = null) {
    const formatted = mapSupportNotification({
      ...notification,
      ticket: ticket || notification.ticket,
    });
    this.notificationEventService.emitToUser(userId, formatted);
    return formatted;
  }
}
