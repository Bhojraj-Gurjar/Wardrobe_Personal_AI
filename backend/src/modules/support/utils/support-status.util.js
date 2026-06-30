import { SUPPORT_TICKET_STATUS } from '../validators/support.constants';

const USER_REOPENABLE = new Set([
  SUPPORT_TICKET_STATUS.RESOLVED,
  SUPPORT_TICKET_STATUS.CLOSED,
]);

const USER_CLOSABLE = new Set([
  SUPPORT_TICKET_STATUS.OPEN,
  SUPPORT_TICKET_STATUS.IN_PROGRESS,
  SUPPORT_TICKET_STATUS.WAITING_FOR_CUSTOMER,
  SUPPORT_TICKET_STATUS.REOPENED,
  SUPPORT_TICKET_STATUS.RESOLVED,
]);

export function canUserReopenTicket(status) {
  return USER_REOPENABLE.has(status);
}

export function canUserCloseTicket(status) {
  return USER_CLOSABLE.has(status);
}

export function resolveStatusFilterValues(status) {
  if (!status) {
    return undefined;
  }

  return String(status).toUpperCase();
}

export function resolveSortOrder(sortBy, sortOrder = 'desc') {
  const allowed = ['created_at', 'updated_at', 'priority', 'status'];
  const field = allowed.includes(sortBy) ? sortBy : 'created_at';
  const order = sortOrder === 'asc' ? 'asc' : 'desc';

  if (field === 'priority') {
    return { priority: order };
  }

  return { [field]: order };
}
