import { OMS_TABS } from '@/features/checkout/constants/checkout.constants';

const TAB_STATUS_MAP = {
  PENDING: ['CREATED'],
  ACCEPTED: ['CONFIRMED'],
  PACKED_RTD: ['PACKING', 'PACKED', 'READY_TO_DISPATCH'],
  IN_TRANSIT: ['SHIPPED', 'READY_FOR_HANDOVER'],
  COMPLETED: ['COMPLETED', 'DELIVERED'],
  CANCELLED: ['CANCELLED'],
  RETURNED: ['RETURNED'],
  REFUNDED: ['REFUNDED'],
  ARCHIVED: ['ARCHIVED'],
};

const TAB_METRIC_KEYS = {
  NEW_ORDERS: 'new_orders',
  ACCEPTED: 'accepted',
  PACKED_RTD: 'packed_rtd',
  IN_TRANSIT: 'in_transit',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
  REFUNDED: 'refunded',
  ARCHIVED: 'archived',
};

const STATUS_TO_SUMMARY_TAB = {
  CREATED: 'NEW_ORDERS',
  CONFIRMED: 'ACCEPTED',
  PACKING: 'PACKED_RTD',
  PACKED: 'PACKED_RTD',
  READY_TO_DISPATCH: 'PACKED_RTD',
  SHIPPED: 'IN_TRANSIT',
  READY_FOR_HANDOVER: 'IN_TRANSIT',
  COMPLETED: 'COMPLETED',
  DELIVERED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
  REFUNDED: 'REFUNDED',
  ARCHIVED: 'ARCHIVED',
};

export function statusToSummaryTab(status) {
  return STATUS_TO_SUMMARY_TAB[status] || null;
}

export function orderMatchesTab(order, tabId) {
  if (!tabId) {
    return true;
  }

  const tab = OMS_TABS.find((item) => item.id === tabId);
  if (!tab?.status) {
    return false;
  }

  const allowed = TAB_STATUS_MAP[tab.status];
  return allowed ? allowed.includes(order?.status) : false;
}

/** One table row per order; line items are shown in the detail drawer. */
export function groupOrderRows(orders) {
  return orders.map((order, orderIndex) => ({
    key: order.id,
    order,
    orderIndex,
    lineCount: order.items?.length || 0,
    itemCount: order.item_count || order.items?.reduce((sum, item) => sum + (item.quantity ?? 1), 0) || 0,
  }));
}

/** @deprecated Use groupOrderRows — kept for any legacy imports */
export function flattenOrderRows(orders) {
  return groupOrderRows(orders);
}

export function getOrderItemsSummary(order) {
  const items = order.items || [];
  if (!items.length) {
    return 'No items';
  }

  const names = items.map((item) => getLineItemName(item)).filter(Boolean);
  if (names.length === 1) {
    return names[0];
  }

  return names.slice(0, 2).join(', ') + (names.length > 2 ? ` +${names.length - 2} more` : '');
}

export function patchOmsSummaryCounters(queryClient, { fromTab, toTab, delta = 1 }) {
  queryClient.setQueryData(['admin-oms-summary'], (current) => {
    if (!current) {
      return current;
    }

    const next = { ...current };

    if (fromTab && TAB_METRIC_KEYS[fromTab]) {
      const key = TAB_METRIC_KEYS[fromTab];
      next[key] = Math.max(0, (next[key] || 0) - delta);
    }

    if (toTab && toTab !== fromTab && TAB_METRIC_KEYS[toTab]) {
      const key = TAB_METRIC_KEYS[toTab];
      next[key] = (next[key] || 0) + delta;
    }

    return next;
  });
}

export function removeOrderFromCache(queryClient, orderId, queryParams) {
  queryClient.setQueryData(['admin-orders', queryParams], (current) => {
    if (!current?.items) {
      return current;
    }

    return {
      ...current,
      items: current.items.filter((item) => item.id !== orderId),
      meta: {
        ...current.meta,
        total: Math.max(0, (current.meta?.total || 1) - 1),
      },
    };
  });
}

export function removeOrdersFromCache(queryClient, orderIds, queryParams) {
  const idSet = new Set(orderIds);

  queryClient.setQueryData(['admin-orders', queryParams], (current) => {
    if (!current?.items) {
      return current;
    }

    const removed = current.items.filter((item) => idSet.has(item.id)).length;

    return {
      ...current,
      items: current.items.filter((item) => !idSet.has(item.id)),
      meta: {
        ...current.meta,
        total: Math.max(0, (current.meta?.total || removed) - removed),
      },
    };
  });
}

export function updateOrderInCache(queryClient, order, queryParams) {
  queryClient.setQueryData(['admin-orders', queryParams], (current) => {
    if (!current?.items) {
      return current;
    }

    return {
      ...current,
      items: current.items.map((item) => (
        item.id === order.id ? { ...item, ...order } : item
      )),
    };
  });
}

export function getSelectedOrderIds(orderRows, selectedRowKeys) {
  if (!selectedRowKeys.length) {
    return [];
  }

  const keySet = new Set(selectedRowKeys);
  return orderRows
    .filter((row) => keySet.has(row.key))
    .map((row) => row.order.id);
}

export function filterRowKeysForOrder(selectedRowKeys, orderId) {
  return selectedRowKeys.filter((key) => key !== orderId);
}

export function getLineItemSku(item) {
  return item?.product?.sku || item?.sku || 'N/A';
}

export function getLineItemName(item) {
  return item?.product?.name || '—';
}

export function getLineItemQty(item, order) {
  if (item) {
    return item.quantity ?? 1;
  }

  return order?.item_count || 0;
}

export function getLineItemSize(item) {
  if (!item) {
    return '—';
  }

  return item.size
    || item.variant_size
    || item.product?.selected_size
    || item.product?.size
    || item.product?.variants?.[0]?.size
    || item.product?.sizeOptions?.[0]
    || item.product?.size_options?.[0]
    || '—';
}

export function getLineItemTotal(item, order) {
  if (item) {
    return (item.price ?? 0) * (item.quantity ?? 1);
  }

  return order?.total_amount ?? 0;
}
