import { ORDER_STATUS } from '../validators/order.constants';

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
    [ORDER_STATUS.COMPLETED]: 'Completed',
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
    HANDOVER: [ORDER_STATUS.READY_FOR_HANDOVER],
    SHIPPED: [ORDER_STATUS.SHIPPED],
    IN_TRANSIT: [ORDER_STATUS.SHIPPED],
    DELIVERED: [ORDER_STATUS.DELIVERED],
    COMPLETED: [ORDER_STATUS.COMPLETED],
    CANCELLED: [ORDER_STATUS.CANCELLED],
    RETURNED: [ORDER_STATUS.RETURNED],
    REFUNDED: [ORDER_STATUS.REFUNDED],
    ARCHIVED: [ORDER_STATUS.ARCHIVED],
    ON_HOLD: [ORDER_STATUS.ON_HOLD],
  };

  return map[statusFilter] || [statusFilter];
}

export function isOrderCancellable(status) {
  return CANCELLABLE_ORDER_STATUSES.includes(status);
}

export function getTimelineSteps(status) {
  const steps = [
    { key: 'placed', label: 'Order Placed', statuses: [ORDER_STATUS.CREATED] },
    { key: 'accepted', label: 'Order Accepted', statuses: [ORDER_STATUS.CONFIRMED] },
    { key: 'invoice', label: 'Invoice Generated', statuses: [] },
    { key: 'packed', label: 'Packed', statuses: [ORDER_STATUS.PACKING, ORDER_STATUS.PACKED] },
    { key: 'rtd', label: 'Ready To Dispatch', statuses: [ORDER_STATUS.READY_TO_DISPATCH] },
    { key: 'handover', label: 'Handed Over', statuses: [ORDER_STATUS.READY_FOR_HANDOVER] },
    { key: 'transit', label: 'Out For Delivery', statuses: [ORDER_STATUS.SHIPPED] },
    { key: 'delivered', label: 'Delivered', statuses: [ORDER_STATUS.DELIVERED] },
    { key: 'completed', label: 'Completed', statuses: [ORDER_STATUS.COMPLETED] },
  ];

  const statusOrder = [
    ORDER_STATUS.CREATED,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PACKING,
    ORDER_STATUS.PACKED,
    ORDER_STATUS.READY_TO_DISPATCH,
    ORDER_STATUS.READY_FOR_HANDOVER,
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.COMPLETED,
  ];

  const currentIndex = statusOrder.indexOf(status);

  return steps.map((step, index) => ({
    ...step,
    complete: currentIndex >= index,
    active: statusOrder[currentIndex] === step.statuses?.[0],
  }));
}
