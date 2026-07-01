import { ORDER_STATUS } from '../validators/order.constants';

export const COMPLETED_REVENUE_STATUSES = [
  ORDER_STATUS.COMPLETED,
  ORDER_STATUS.DELIVERED,
];

export const REFUND_REVENUE_STATUSES = [
  ORDER_STATUS.REFUNDED,
  ORDER_STATUS.RETURNED,
];

export function getDayBounds(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function buildCompletedRevenueWhereForDay(date = new Date()) {
  const { start, end } = getDayBounds(date);

  return buildCompletedRevenueWhereForRange(start, end);
}

export function buildTodayCompletedRevenueWhere() {
  return buildCompletedRevenueWhereForDay(new Date());
}

export function buildCompletedRevenueWhereForRange(start, end) {
  return {
    status: { in: COMPLETED_REVENUE_STATUSES },
    OR: [
      { completed_at: { gte: start, lte: end } },
      { delivered_at: { gte: start, lte: end } },
    ],
  };
}

export function buildRefundRevenueWhereForRange(start, end) {
  return {
    status: { in: REFUND_REVENUE_STATUSES },
    updated_at: { gte: start, lte: end },
  };
}

export function resolveOrderRecognitionDate(order) {
  if (!order) {
    return null;
  }

  const raw = order.completed_at || order.delivered_at || null;
  return raw ? new Date(raw) : null;
}

export function resolveOrderRefundDate(order) {
  if (!order) {
    return null;
  }

  const raw = order.updated_at || order.completed_at || order.created_at;
  return raw ? new Date(raw) : null;
}

export function isDateInRange(date, start, end) {
  if (!date) {
    return false;
  }

  const value = date instanceof Date ? date : new Date(date);

  if (start && value < start) {
    return false;
  }

  if (end && value > end) {
    return false;
  }

  return true;
}

export function getOrderRevenueEvent(order) {
  if (!order) {
    return null;
  }

  if (COMPLETED_REVENUE_STATUSES.includes(order.status)) {
    const date = resolveOrderRecognitionDate(order);
    if (!date) {
      return null;
    }

    return {
      date,
      amount: Number(order.total_amount) || 0,
      type: 'credit',
    };
  }

  if (REFUND_REVENUE_STATUSES.includes(order.status)) {
    const date = resolveOrderRefundDate(order);
    if (!date) {
      return null;
    }

    return {
      date,
      amount: Number(order.total_amount) || 0,
      type: 'debit',
    };
  }

  return null;
}

export function computeNetRevenueFromEvents(orders = [], { startDate, endDate } = {}) {
  const start = startDate ? new Date(startDate) : null;
  const end = endDate ? new Date(endDate) : null;

  let grossRevenue = 0;
  let refundAmount = 0;
  let recognizedOrders = 0;

  for (const order of orders) {
    const event = getOrderRevenueEvent(order);
    if (!event || !isDateInRange(event.date, start, end)) {
      continue;
    }

    if (event.type === 'credit') {
      grossRevenue += event.amount;
      recognizedOrders += 1;
    } else {
      refundAmount += event.amount;
    }
  }

  const netRevenue = grossRevenue - refundAmount;

  return {
    grossRevenue: Math.round(grossRevenue),
    refundAmount: Math.round(refundAmount),
    netRevenue: Math.round(netRevenue),
    recognizedOrders,
  };
}

export function monthBucketKey(date) {
  const value = date instanceof Date ? date : new Date(date);
  return `${value.getFullYear()}-${String(value.getMonth()).padStart(2, '0')}`;
}

export function buildMonthlyRevenueSeries(orders = [], months = 6, monthLabels = []) {
  const now = new Date();
  const buckets = [];

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    buckets.push({
      key: monthBucketKey(date),
      month: monthLabels[date.getMonth()] || date.toLocaleString('en-US', { month: 'short' }),
      revenue: 0,
      orders: 0,
    });
  }

  const bucketMap = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const order of orders) {
    const created = new Date(order.created_at);
    const createdKey = monthBucketKey(created);
    const createdBucket = bucketMap.get(createdKey);

    if (createdBucket && order.status !== ORDER_STATUS.CANCELLED) {
      createdBucket.orders += 1;
    }

    const event = getOrderRevenueEvent(order);
    if (!event) {
      continue;
    }

    const revenueKey = monthBucketKey(event.date);
    const revenueBucket = bucketMap.get(revenueKey);
    if (!revenueBucket) {
      continue;
    }

    if (event.type === 'credit') {
      revenueBucket.revenue += event.amount;
    } else {
      revenueBucket.revenue -= event.amount;
    }
  }

  return buckets.map((bucket) => ({
    ...bucket,
    revenue: Math.round(bucket.revenue),
  }));
}
