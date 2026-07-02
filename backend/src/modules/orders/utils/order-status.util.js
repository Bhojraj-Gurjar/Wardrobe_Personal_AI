import { ORDER_STATUS } from '../validators/order.constants';
import { canTransition } from './order-transition.util';

export const TERMINAL_ORDER_STATUSES = [
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.REFUNDED,
  ORDER_STATUS.ARCHIVED,
];

export const CANCELLABLE_ORDER_STATUSES = [
  ORDER_STATUS.CREATED,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PACKING,
  ORDER_STATUS.PACKED,
  ORDER_STATUS.READY_TO_DISPATCH,
  ORDER_STATUS.READY_FOR_HANDOVER,
  ORDER_STATUS.SHIPPED,
];

export const ACTIVE_ORDER_STATUSES = [
  ORDER_STATUS.CREATED,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PACKING,
  ORDER_STATUS.PACKED,
  ORDER_STATUS.READY_TO_DISPATCH,
  ORDER_STATUS.READY_FOR_HANDOVER,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.ON_HOLD,
];

/** OMS uses admin-driven transitions — auto-status disabled. */
export function resolveAutoStatus() {
  return null;
}

export function normalizeDisplayStatus(status) {
  const map = {
    [ORDER_STATUS.CREATED]: 'New Order',
    [ORDER_STATUS.CONFIRMED]: 'Accepted',
    [ORDER_STATUS.PACKING]: 'Packing',
    [ORDER_STATUS.PACKED]: 'Packed',
    [ORDER_STATUS.READY_TO_DISPATCH]: 'Ready To Dispatch',
    [ORDER_STATUS.READY_FOR_HANDOVER]: 'Ready For Handover',
    [ORDER_STATUS.SHIPPED]: 'In Transit',
    [ORDER_STATUS.DELIVERED]: 'Delivered',
    [ORDER_STATUS.COMPLETED]: 'Delivered',
    [ORDER_STATUS.CANCELLED]: 'Cancelled',
    [ORDER_STATUS.RETURNED]: 'Returned',
    [ORDER_STATUS.REFUNDED]: 'Refunded',
    [ORDER_STATUS.ARCHIVED]: 'Archived',
    [ORDER_STATUS.ON_HOLD]: 'On Hold',
  };

  return map[status] || 'Pending';
}

export function resolveStatusFilterValues(statusFilter) {
  if (!statusFilter || statusFilter === 'ALL') {
    return null;
  }

  const map = {
    PENDING: [ORDER_STATUS.CREATED],
    NEW_ORDERS: [ORDER_STATUS.CREATED],
    PROCESSING: [
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PACKING,
      ORDER_STATUS.PACKED,
      ORDER_STATUS.READY_TO_DISPATCH,
      ORDER_STATUS.READY_FOR_HANDOVER,
    ],
    LABEL_INVOICE: [ORDER_STATUS.CONFIRMED],
    ACCEPTED: [ORDER_STATUS.CONFIRMED],
    PACKING: [ORDER_STATUS.PACKING],
    PACKED_RTD: [ORDER_STATUS.PACKING, ORDER_STATUS.PACKED, ORDER_STATUS.READY_TO_DISPATCH],
    RTD: [ORDER_STATUS.PACKED, ORDER_STATUS.READY_TO_DISPATCH],
    SHIPPED: [ORDER_STATUS.SHIPPED, ORDER_STATUS.READY_FOR_HANDOVER],
    IN_TRANSIT: [ORDER_STATUS.SHIPPED, ORDER_STATUS.READY_FOR_HANDOVER],
    COMPLETED: [ORDER_STATUS.COMPLETED, ORDER_STATUS.DELIVERED],
    CANCELLED: [ORDER_STATUS.CANCELLED],
    RETURNED: [ORDER_STATUS.RETURNED],
    REFUNDED: [ORDER_STATUS.REFUNDED],
    ARCHIVED: [ORDER_STATUS.ARCHIVED],
    ON_HOLD: [ORDER_STATUS.ON_HOLD],
  };

  return map[statusFilter] || [statusFilter];
}

export function isOrderCancellable(status) {
  return canTransition(status, ORDER_STATUS.CANCELLED);
}

export function getTimelineSteps(status) {
  const steps = [
    { key: 'placed', label: 'Order Placed', statuses: [ORDER_STATUS.CREATED] },
    { key: 'accepted', label: 'Accepted', statuses: [ORDER_STATUS.CONFIRMED] },
    { key: 'packed', label: 'Packed / Ready To Dispatch', statuses: [ORDER_STATUS.PACKING, ORDER_STATUS.PACKED, ORDER_STATUS.READY_TO_DISPATCH] },
    { key: 'transit', label: 'In Transit', statuses: [ORDER_STATUS.SHIPPED, ORDER_STATUS.READY_FOR_HANDOVER] },
    {
      key: 'completed',
      label: 'Delivered / Completed',
      statuses: [ORDER_STATUS.COMPLETED, ORDER_STATUS.DELIVERED],
    },
  ];

  const statusOrder = [
    ORDER_STATUS.CREATED,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PACKING,
    ORDER_STATUS.PACKED,
    ORDER_STATUS.READY_TO_DISPATCH,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.READY_FOR_HANDOVER,
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.DELIVERED,
  ];

  const currentIndex = statusOrder.indexOf(status);

  return steps.map((step, index) => ({
    ...step,
    complete: currentIndex >= index,
    active: statusOrder[currentIndex] === step.statuses?.[0],
  }));
}
