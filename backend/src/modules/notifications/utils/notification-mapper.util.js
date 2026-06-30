import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_DOMAINS,
} from '../notifications.constants';

export function buildNotificationId(domain, id) {
  return `${domain}:${id}`;
}

export function parseNotificationId(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const [domain, ...rest] = value.split(':');
  const id = rest.join(':');

  if (!domain || !id) {
    return null;
  }

  return { domain, id };
}

export function mapOrderNotification(item) {
  return {
    id: buildNotificationId(NOTIFICATION_DOMAINS.ORDER, item.id),
    domain: NOTIFICATION_DOMAINS.ORDER,
    category: NOTIFICATION_CATEGORIES.ORDERS,
    type: item.type,
    title: item.title,
    description: item.message,
    isRead: item.is_read,
    readAt: null,
    actionPath: item.order_id ? `/orders/${item.order_id}` : null,
    entityType: 'order',
    entityId: item.order_id,
    metadata: item.metadata || null,
    createdAt: item.created_at,
    order: item.order
      ? {
          id: item.order.id,
          orderNumber: item.order.order_number,
          status: item.order.status,
        }
      : null,
    ticket: null,
  };
}

export function mapSupportNotification(item) {
  return {
    id: buildNotificationId(NOTIFICATION_DOMAINS.SUPPORT, item.id),
    domain: NOTIFICATION_DOMAINS.SUPPORT,
    category: NOTIFICATION_CATEGORIES.SUPPORT,
    type: item.notification_type,
    title: item.title,
    description: item.body,
    isRead: item.is_read,
    readAt: item.read_at,
    actionPath: item.ticket_id ? `/support/tickets/${item.ticket_id}` : null,
    entityType: 'ticket',
    entityId: item.ticket_id,
    metadata: item.metadata || null,
    createdAt: item.created_at,
    order: null,
    ticket: item.ticket
      ? {
          id: item.ticket.id,
          ticketNumber: item.ticket.ticket_number,
          subject: item.ticket.subject,
          status: item.ticket.status,
        }
      : null,
  };
}

export function mapAppNotification(item) {
  return {
    id: buildNotificationId(NOTIFICATION_DOMAINS.APP, item.id),
    domain: NOTIFICATION_DOMAINS.APP,
    category: item.category,
    type: item.type,
    title: item.title,
    description: item.description,
    isRead: item.is_read,
    readAt: item.read_at,
    actionPath: item.action_path,
    entityType: item.entity_type,
    entityId: item.entity_id,
    metadata: item.metadata || null,
    createdAt: item.created_at,
    order: null,
    ticket: null,
  };
}

export function matchesCategory(notification, category) {
  if (!category || category === 'ALL') {
    return true;
  }

  return notification.category === category;
}

export function matchesSearch(notification, search) {
  if (!search) {
    return true;
  }

  const haystack = [
    notification.title,
    notification.description,
    notification.type,
    notification.order?.orderNumber,
    notification.ticket?.ticketNumber,
    notification.ticket?.subject,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(search.toLowerCase());
}
