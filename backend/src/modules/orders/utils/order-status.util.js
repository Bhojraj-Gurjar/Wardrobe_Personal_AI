import { ORDER_STATUS } from '../validators/order.constants';

export const TERMINAL_ORDER_STATUSES = [
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
];

export const CANCELLABLE_ORDER_STATUSES = [
  ORDER_STATUS.CREATED,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PACKED,
];

export const ACTIVE_ORDER_STATUSES = [
  ORDER_STATUS.CREATED,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PACKED,
  ORDER_STATUS.SHIPPED,
];

const MS_MINUTE = 60 * 1000;

export function resolveAutoStatus(createdAt, currentStatus, now = Date.now()) {
  if (TERMINAL_ORDER_STATUSES.includes(currentStatus)) {
    return null;
  }

  const ageMs = now - new Date(createdAt).getTime();

  if (ageMs >= 60 * MS_MINUTE) {
    return ORDER_STATUS.DELIVERED;
  }

  if (ageMs >= 30 * MS_MINUTE) {
    return ORDER_STATUS.SHIPPED;
  }

  if (ageMs >= 10 * MS_MINUTE) {
    return ORDER_STATUS.CONFIRMED;
  }

  return null;
}

export function normalizeDisplayStatus(status) {
  if (status === ORDER_STATUS.DELIVERED) return 'Delivered';
  if (status === ORDER_STATUS.SHIPPED) return 'Shipped';
  if (status === ORDER_STATUS.CANCELLED) return 'Cancelled';
  if (
    status === ORDER_STATUS.CONFIRMED
    || status === ORDER_STATUS.PACKED
  ) {
    return 'Processing';
  }
  if (status === ORDER_STATUS.CREATED) {
    return 'Pending';
  }
  return 'Pending';
}

export function resolveStatusFilterValues(statusFilter) {
  if (!statusFilter || statusFilter === 'ALL') {
    return null;
  }

  const map = {
    PENDING: [ORDER_STATUS.CREATED],
    PROCESSING: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.PACKED],
    SHIPPED: [ORDER_STATUS.SHIPPED],
    DELIVERED: [ORDER_STATUS.DELIVERED],
    CANCELLED: [ORDER_STATUS.CANCELLED],
  };

  return map[statusFilter] || [statusFilter];
}

export function isOrderCancellable(status) {
  return CANCELLABLE_ORDER_STATUSES.includes(status);
}
