const STATUS_RANK = {
  CREATED: 0,
  ON_HOLD: 0,
  CONFIRMED: 1,
  PACKING: 2,
  PACKED: 3,
  READY_TO_DISPATCH: 4,
  READY_FOR_HANDOVER: 5,
  SHIPPED: 5,
  DELIVERED: 6,
  COMPLETED: 6,
  CANCELLED: -1,
  RETURNED: 9,
  REFUNDED: 10,
  ARCHIVED: 11,
};

export const FULFILLMENT_TRACKING_STEPS = [
  {
    key: 'placed',
    label: 'Order Placed',
    actions: ['ORDER_CREATED'],
    statuses: ['CREATED'],
    rank: 0,
  },
  {
    key: 'accepted',
    label: 'Accepted',
    actions: ['ORDER_ACCEPTED'],
    statuses: ['CONFIRMED'],
    rank: 1,
  },
  {
    key: 'packed',
    label: 'Packed / Ready To Dispatch',
    actions: ['ORDER_PACKED', 'MOVED_TO_PACKING', 'READY_TO_DISPATCH'],
    statuses: ['PACKING', 'PACKED', 'READY_TO_DISPATCH'],
    rank: 3,
  },
  {
    key: 'transit',
    label: 'In Transit',
    actions: ['ORDER_SHIPPED'],
    statuses: ['SHIPPED'],
    rank: 5,
  },
  {
    key: 'delivered',
    label: 'Delivered / Completed',
    actions: ['ORDER_COMPLETED', 'ORDER_DELIVERED'],
    statuses: ['COMPLETED', 'DELIVERED'],
    rank: 6,
  },
];

/** Steps hidden from the customer delivery journey UI (data may still exist in timeline). */
export const HIDDEN_CUSTOMER_TRACKING_STEP_KEYS = new Set([
  'invoice',
  'label',
  'handover',
  'rtd',
]);

export const RETURN_TRACKING_STEPS = [
  { key: 'delivered', label: 'Delivered', actions: ['ORDER_COMPLETED', 'ORDER_DELIVERED'], rank: 8 },
  { key: 'return_requested', label: 'Return Requested', actions: ['ORDER_RETURNED'], rank: 9 },
  { key: 'return_approved', label: 'Return Approved', actions: ['RETURN_APPROVED'], rank: 9.1 },
  { key: 'pickup_scheduled', label: 'Pickup Scheduled', actions: ['RETURN_PICKUP_SCHEDULED'], rank: 9.2 },
  { key: 'picked_up', label: 'Picked Up', actions: ['RETURN_PICKED_UP'], rank: 9.3 },
  { key: 'refund_initiated', label: 'Refund Initiated', actions: ['ORDER_REFUNDED'], rank: 9.5 },
  { key: 'refund_completed', label: 'Refund Completed', actions: ['REFUND_COMPLETED'], statuses: ['REFUNDED'], rank: 10 },
];

export const CANCEL_TRACKING_STEPS = [
  { key: 'placed', label: 'Order Placed', actions: ['ORDER_CREATED'], statuses: ['CREATED'], rank: 0 },
  { key: 'accepted', label: 'Accepted', actions: ['ORDER_ACCEPTED'], statuses: ['CONFIRMED'], rank: 1 },
  { key: 'cancelled', label: 'Cancelled', actions: ['ORDER_CANCELLED'], statuses: ['CANCELLED'], rank: -1 },
];

function getOrderRank(status) {
  return STATUS_RANK[status] ?? -2;
}

function findTimelineEntry(timeline = [], step) {
  return timeline.find((entry) => {
    if (step.actions?.includes(entry.action)) {
      return true;
    }

    if (step.statuses?.includes(entry.to_status)) {
      return true;
    }

    return false;
  });
}

function isStepComplete(order, step) {
  const timeline = order?.timeline || [];
  const flags = order?.oms_flags || {};
  const rank = getOrderRank(order?.status);

  if (step.flag && flags[step.flag]) {
    return true;
  }

  if (findTimelineEntry(timeline, step)) {
    return true;
  }

  if (step.statuses?.length) {
    const stepMaxRank = Math.max(...step.statuses.map((status) => getOrderRank(status)));
    if (rank >= stepMaxRank && stepMaxRank >= 0) {
      return true;
    }
  }

  if (step.key === 'placed') {
    return true;
  }

  return false;
}

export function resolveTrackingMode(order) {
  if (!order) {
    return 'fulfillment';
  }

  if (order.status === 'CANCELLED') {
    return 'cancelled';
  }

  if (['RETURNED', 'REFUNDED'].includes(order.status)) {
    return 'return';
  }

  const timeline = order.timeline || [];
  if (timeline.some((entry) => ['ORDER_RETURNED', 'ORDER_REFUNDED', 'REFUND_COMPLETED'].includes(entry.action))) {
    return 'return';
  }

  return 'fulfillment';
}

export function resolveTrackingStepDefinitions(order) {
  const mode = resolveTrackingMode(order);

  if (mode === 'cancelled') {
    const steps = [...CANCEL_TRACKING_STEPS];
    const wasAccepted = isStepComplete(order, CANCEL_TRACKING_STEPS[1]);

    return wasAccepted ? steps : steps.filter((step) => step.key !== 'accepted');
  }

  if (mode === 'return') {
    return RETURN_TRACKING_STEPS;
  }

  return FULFILLMENT_TRACKING_STEPS.filter(
    (step) => !HIDDEN_CUSTOMER_TRACKING_STEP_KEYS.has(step.key),
  );
}

export function buildTrackingSteps(order) {
  const definitions = resolveTrackingStepDefinitions(order);
  const enriched = definitions.map((step) => {
    const entry = findTimelineEntry(order?.timeline || [], step);
    const complete = isStepComplete(order, step);

    return {
      ...step,
      complete,
      entry,
      timestamp: entry?.created_at || resolveStepTimestamp(order, step),
      actorRole: entry?.actor_role,
      notes: entry?.notes,
    };
  });

  let currentIndex = enriched.findIndex((step) => !step.complete);

  if (currentIndex === -1) {
    currentIndex = enriched.length - 1;
  }

  return enriched.map((step, index) => ({
    ...step,
    state: step.complete
      ? 'complete'
      : index === currentIndex
        ? 'current'
        : 'pending',
  }));
}

function resolveStepTimestamp(order, step) {
  const map = {
    placed: order?.created_at,
    accepted: order?.updated_at,
    invoice: order?.invoice_generated_at,
    label: order?.label_generated_at,
    packed: order?.packed_at,
    transit: order?.in_transit_at || order?.dispatched_at,
    delivered: order?.delivered_at || order?.completed_at,
  };

  return map[step.key] || null;
}

export function calculateTrackingProgress(steps) {
  if (!steps.length) {
    return 0;
  }

  const completed = steps.filter((step) => step.state === 'complete').length;
  return Math.min(100, Math.round((completed / steps.length) * 100));
}

export function formatTrackingDateTime(value) {
  if (!value) {
    return { date: '—', time: '—' };
  }

  const parsed = new Date(value);

  return {
    date: parsed.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    time: parsed.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
    }),
  };
}

export function formatActorLabel(actorRole) {
  if (!actorRole) {
    return 'System';
  }

  if (actorRole === 'ADMIN') {
    return 'Admin';
  }

  if (actorRole === 'CUSTOMER') {
    return 'Customer';
  }

  return actorRole.replace(/_/g, ' ');
}

export function collectOrderSkus(order) {
  const items = order?.items || [];

  return items
    .map((item) => item.product?.sku || item.product_id)
    .filter(Boolean);
}

export function resolveCancellationDetails(order) {
  const entry = order?.timeline?.find((item) => item.action === 'ORDER_CANCELLED');

  return {
    reason: entry?.notes || order?.oms_metadata?.cancellation_reason || 'No reason provided',
    cancelledBy: formatActorLabel(entry?.actor_role),
    cancelledAt: entry?.created_at || order?.updated_at,
  };
}

export function resolveRefundDetails(order) {
  const metadata = order?.oms_metadata || {};
  const refundEntry = order?.timeline?.find((item) =>
    ['ORDER_REFUNDED', 'REFUND_COMPLETED'].includes(item.action),
  );

  return {
    amount: metadata.refund_amount ?? order?.total_amount,
    method: metadata.refund_method || order?.payment_method || 'Original payment method',
    transactionId: metadata.refund_transaction_id || metadata.refund_reference || '—',
    date: refundEntry?.created_at || order?.updated_at,
    status: order?.status === 'REFUNDED' ? 'Completed' : 'In progress',
  };
}

export function resolveLiveDeliveryInfo(order) {
  const metadata = order?.oms_metadata || {};

  return {
    currentLocation: metadata.current_location || metadata.tracking_location || null,
    lastUpdated: order?.updated_at,
    estimatedDelivery: order?.estimated_delivery,
    deliveryWindow: metadata.delivery_window || null,
    courierContact: metadata.courier_contact || metadata.courier_phone || null,
  };
}
