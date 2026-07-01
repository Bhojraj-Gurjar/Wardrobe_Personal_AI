'use client';

import { memo, useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  Printer,
  Search,
  Tag,
} from 'lucide-react';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { AdminPageHeader } from '@/features/admin/components/admin-metric-card';
import { AdminOmsSummaryCards } from '@/features/admin/components/admin-oms-summary-cards';
import { useAdminOrdersQuery, useAdminToken } from '@/features/admin/hooks';
import { useAdminOrderEvents } from '@/features/admin/hooks/use-admin-order-events';
import {
  adminOmsActions,
  bulkAcceptAdminOrders,
  exportAdminOrdersCsv,
  fetchAdminOmsSummary,
} from '@/features/admin/services/admin.service';
import { OMS_TABS } from '@/features/checkout/constants/checkout.constants';
import { StatusBadge } from '@/features/orders/components/order-timeline';
import { formatOrderDate } from '@/features/orders/utils/order-status';
import { formatProductPrice } from '@/features/products/utils/product-catalog.utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectField as Select } from '@/components/ui/select';
import { formCheckboxClass } from '@/components/ui/form-control-styles';
import { showToast } from '@/stores/toast-store';
import { cn } from '@/utils/cn';

const STATUS_TO_TAB = {
  CONFIRMED: 'ACCEPTED',
  PACKING: 'PACKED_RTD',
  PACKED: 'PACKED_RTD',
  READY_TO_DISPATCH: 'PACKED_RTD',
  READY_FOR_HANDOVER: 'IN_TRANSIT',
  SHIPPED: 'IN_TRANSIT',
  COMPLETED: 'COMPLETED',
};

const ACTION_SUCCESS_MESSAGES = {
  accept: 'Order accepted — invoice & label generated',
  quickMarkRtd: 'Order marked Ready To Dispatch',
  markRtd: 'Order marked Ready To Dispatch',
  dispatchOrder: 'Order dispatched — now in transit',
  markShipped: 'Order marked in transit',
};

function DeliveredBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
      <CheckCircle2 className="size-3.5" />
      Delivered
    </span>
  );
}

function formatAddressSnippet(address) {
  if (!address) return '—';
  const parts = [address.city, address.state, address.pincode].filter(Boolean);
  return parts.join(', ') || address.full_name || '—';
}

function getOrderSkuLabel(order) {
  const skus = (order.items || [])
    .map((item) => item.product?.sku)
    .filter(Boolean);

  if (!skus.length) {
    return 'N/A';
  }

  const unique = [...new Set(skus)];
  if (unique.length === 1) {
    const extra = (order.items?.length || 0) > 1 ? ` (+${order.items.length - 1})` : '';
    return `${unique[0]}${extra}`;
  }

  return unique.join(', ');
}

function getPrimaryProductLabel(order) {
  const first = order.items?.[0]?.product?.name;
  if (first) {
    const extra = (order.items?.length || 0) > 1 ? ` +${order.items.length - 1}` : '';
    return `${first}${extra}`;
  }
  return order.product_id ? 'Product order' : '—';
}

async function downloadDocument(url, filename) {
  if (!url) return;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${filename}`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

async function downloadOrderDocuments(order) {
  const invoice = order?.documents?.find((doc) => doc.document_type === 'INVOICE');
  const label = order?.documents?.find((doc) => doc.document_type === 'SHIPPING_LABEL');
  const tasks = [];

  if (invoice?.public_url) {
    tasks.push(downloadDocument(invoice.public_url, `Invoice-${order.order_number}.pdf`));
  }
  if (label?.public_url) {
    tasks.push(downloadDocument(label.public_url, `Label-${order.order_number}.pdf`));
  }

  await Promise.all(tasks);
}

function openOrderDocuments(order) {
  const invoice = order?.documents?.find((doc) => doc.document_type === 'INVOICE');
  const label = order?.documents?.find((doc) => doc.document_type === 'SHIPPING_LABEL');
  if (invoice?.public_url) {
    window.open(invoice.public_url, '_blank', 'noopener,noreferrer');
  }
  if (label?.public_url) {
    window.open(label.public_url, '_blank', 'noopener,noreferrer');
  }
}

function resolveCompletedDateRange(preset) {
  const now = new Date();
  const startOfDay = (date) => {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };
  const endOfDay = (date) => {
    const copy = new Date(date);
    copy.setHours(23, 59, 59, 999);
    return copy;
  };

  switch (preset) {
    case 'today':
      return { dateFrom: startOfDay(now).toISOString(), dateTo: endOfDay(now).toISOString() };
    case 'yesterday': {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return { dateFrom: startOfDay(yesterday).toISOString(), dateTo: endOfDay(yesterday).toISOString() };
    }
    case 'last_7_days': {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      return { dateFrom: startOfDay(from).toISOString(), dateTo: endOfDay(now).toISOString() };
    }
    case 'last_30_days': {
      const from = new Date(now);
      from.setDate(from.getDate() - 29);
      return { dateFrom: startOfDay(from).toISOString(), dateTo: endOfDay(now).toISOString() };
    }
    default:
      return {};
  }
}

function removeOrderFromCache(queryClient, orderId, queryParams) {
  queryClient.setQueryData(['admin-orders', queryParams], (current) => {
    if (!current?.items) return current;
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

function StageActionButton({ order, activeTab, pendingAction, onAction }) {
  const isPending = pendingAction?.orderId === order.id;
  const spinner = isPending ? <Loader2 className="size-3.5 animate-spin" /> : null;

  const buttonProps = (action, label) => ({
    size: 'sm',
    disabled: Boolean(pendingAction),
    onClick: () => onAction({ action, orderId: order.id }),
    children: (
      <>
        {isPending && pendingAction?.action === action ? spinner : null}
        {label}
      </>
    ),
  });

  if (activeTab === 'ACCEPTED' && order.status === 'CONFIRMED') {
    return <Button {...buttonProps('quickMarkRtd', 'Mark RTD')} />;
  }

  if (activeTab === 'PACKED_RTD') {
    if (order.status === 'PACKING') {
      return <Button {...buttonProps('quickMarkRtd', 'Mark RTD')} />;
    }
    if (order.status === 'PACKED') {
      return <Button {...buttonProps('markRtd', 'Mark RTD')} />;
    }
    if (order.status === 'READY_TO_DISPATCH') {
      return (
        <Button
          {...buttonProps('dispatchOrder', 'Dispatch Order')}
          onClick={() => onAction({
            action: 'dispatchOrder',
            orderId: order.id,
            payload: {
              courier_name: order.courier_name || 'Manual Courier',
              tracking_number: order.tracking_number || `TRK-${order.order_number}`,
            },
          })}
        />
      );
    }
  }

  if (activeTab === 'NEW_ORDERS' && order.status === 'CREATED') {
    return <Button {...buttonProps('accept', 'Accept Order')} />;
  }

  return null;
}

const OrderRow = memo(function OrderRow({
  order,
  activeTab,
  pendingAction,
  selected,
  showCheckbox,
  onToggleSelect,
  onAction,
}) {
  return (
    <motion.tr
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.2 }}
      className="border-t border-dashboard-border/60 transition-colors hover:bg-primary/[0.04]"
    >
      {showCheckbox ? (
        <td className="px-3 py-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            className={formCheckboxClass}
            aria-label={`Select order ${order.order_number}`}
          />
        </td>
      ) : null}
      <td className="whitespace-nowrap px-3 py-3 font-medium text-dashboard-foreground">
        {order.order_number}
      </td>
      <td className="px-3 py-3">
        <div className="min-w-[120px]">
          <p className="font-medium text-dashboard-foreground">{order.user?.name || '—'}</p>
          <p className="text-xs text-dashboard-muted">{order.user?.mobile || order.user?.email || '—'}</p>
        </div>
      </td>
      <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-primary/90">
        {getOrderSkuLabel(order)}
      </td>
      <td className="max-w-[200px] truncate px-3 py-3 text-dashboard-muted" title={getPrimaryProductLabel(order)}>
        {getPrimaryProductLabel(order)}
      </td>
      <td className="px-3 py-3 text-center text-dashboard-muted">{order.item_count || 0}</td>
      <td className="whitespace-nowrap px-3 py-3 font-semibold text-dashboard-foreground">
        {formatProductPrice(order.total_amount)}
      </td>
      <td className="px-3 py-3 text-dashboard-muted">{order.payment_method || 'COD'}</td>
      <td className="px-3 py-3 capitalize text-dashboard-muted">{order.payment_status || 'pending'}</td>
      <td className="whitespace-nowrap px-3 py-3 text-dashboard-muted">{formatOrderDate(order.created_at)}</td>
      <td className="max-w-[160px] truncate px-3 py-3 text-dashboard-muted" title={formatAddressSnippet(order.shipping_address)}>
        {formatAddressSnippet(order.shipping_address)}
      </td>
      <td className="px-3 py-3">
        {activeTab === 'COMPLETED' && ['COMPLETED', 'DELIVERED'].includes(order.status)
          ? <DeliveredBadge />
          : <StatusBadge status={order.status} />}
      </td>
      <td className="px-3 py-3">
        <StageActionButton
          order={order}
          activeTab={activeTab}
          pendingAction={pendingAction}
          onAction={onAction}
        />
      </td>
    </motion.tr>
  );
});

export function AdminOmsBoard() {
  const token = useAdminToken();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('NEW_ORDERS');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');
  const [completedPreset, setCompletedPreset] = useState('last_7_days');
  const [selectedIds, setSelectedIds] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);
  const [bulkPending, setBulkPending] = useState(null);

  useAdminOrderEvents({ enabled: Boolean(token), token });

  const tab = OMS_TABS.find((item) => item.id === activeTab) || OMS_TABS[0];
  const completedRange = activeTab === 'COMPLETED' ? resolveCompletedDateRange(completedPreset) : {};

  const orderQueryParams = useMemo(() => ({
    status: tab.status,
    search: search || undefined,
    page,
    limit: 20,
    sort,
    ...completedRange,
  }), [tab.status, search, page, sort, completedRange]);

  const summaryQuery = useQuery({
    queryKey: ['admin-oms-summary'],
    queryFn: () => fetchAdminOmsSummary(token),
    enabled: Boolean(token),
    refetchInterval: 30000,
  });

  const ordersQuery = useAdminOrdersQuery(orderQueryParams);

  const invalidateSummary = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin-oms-summary'] });
    queryClient.invalidateQueries({ queryKey: ['admin-orders-summary'] });
  }, [queryClient]);

  const handleActionSuccess = useCallback(async (order, action) => {
    removeOrderFromCache(queryClient, order.id, orderQueryParams);
    invalidateSummary();

    if (action === 'accept' && order?.status === 'CONFIRMED') {
      try {
        await downloadOrderDocuments(order);
      } catch {
        openOrderDocuments(order);
      }
      const nextTab = STATUS_TO_TAB[order.status];
      if (nextTab) {
        setActiveTab(nextTab);
        setPage(1);
      }
      showToast(ACTION_SUCCESS_MESSAGES.accept);
      return;
    }

    const nextTab = STATUS_TO_TAB[order?.status];
    if (nextTab && nextTab !== activeTab) {
      setActiveTab(nextTab);
      setPage(1);
    }

    showToast(ACTION_SUCCESS_MESSAGES[action] || 'Order updated');
    queryClient.invalidateQueries({ queryKey: ['admin-orders', orderQueryParams] });
  }, [activeTab, invalidateSummary, orderQueryParams, queryClient]);

  const runOrderAction = useCallback(async ({ action, orderId, payload }) => {
    setPendingAction({ orderId, action });
    try {
      const order = await adminOmsActions[action](orderId, token, payload);
      await handleActionSuccess(order, action);
    } catch (error) {
      showToast(error?.message || 'Action failed', 'error');
      ordersQuery.refetch();
    } finally {
      window.setTimeout(() => setPendingAction(null), 600);
    }
  }, [handleActionSuccess, ordersQuery, token]);

  const bulkAcceptMutation = useMutation({
    mutationFn: (orderIds) => bulkAcceptAdminOrders(orderIds, token),
    onMutate: () => setBulkPending('accept'),
    onSuccess: async (result) => {
      invalidateSummary();
      setSelectedIds([]);
      setActiveTab('ACCEPTED');
      setPage(1);

      for (const order of result?.accepted || []) {
        try {
          await downloadOrderDocuments(order);
        } catch {
          openOrderDocuments(order);
        }
      }

      const count = result?.acceptedCount || 0;
      const errors = result?.errorCount || 0;
      showToast(
        errors
          ? `Accepted ${count} orders (${errors} failed)`
          : `Accepted ${count} orders — invoices & labels downloaded`,
        errors ? 'error' : 'success',
      );
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (error) => {
      showToast(error?.message || 'Bulk accept failed', 'error');
    },
    onSettled: () => setBulkPending(null),
  });

  const metrics = summaryQuery.data || {};
  const orders = ordersQuery.data?.items || [];
  const meta = ordersQuery.data?.meta || { page: 1, totalPages: 1, total: 0 };
  const allSelected = orders.length > 0 && selectedIds.length === orders.length;

  const runBulkDocumentAction = useCallback(async (type) => {
    const orderList = orders;
    const targetIds = selectedIds.length ? selectedIds : orderList.map((order) => order.id);
    if (!targetIds.length) {
      showToast('No orders selected', 'error');
      return;
    }

    setBulkPending(type);
    let successCount = 0;

    try {
      for (const orderId of targetIds) {
        try {
          const existing = orderList.find((item) => item.id === orderId);

          if (type === 'invoice' || type === 'invoices') {
            await adminOmsActions.generateInvoice(orderId, token);
            successCount += 1;
            continue;
          }

          if (type === 'label' || type === 'labels') {
            await adminOmsActions.generateLabel(orderId, token);
            successCount += 1;
            continue;
          }

          if (type === 'download') {
            let order = existing;
            if (!order?.documents?.some((doc) => doc.public_url)) {
              order = await adminOmsActions.generateInvoice(orderId, token);
              order = await adminOmsActions.generateLabel(orderId, token);
            }
            if (order) {
              await downloadOrderDocuments(order);
            }
            successCount += 1;
            continue;
          }

          if (type === 'print-labels' || type === 'print-invoices') {
            const docType = type === 'print-labels' ? 'SHIPPING_LABEL' : 'INVOICE';
            let doc = existing?.documents?.find((item) => item.document_type === docType);
            if (!doc?.public_url) {
              const order = type === 'print-labels'
                ? await adminOmsActions.generateLabel(orderId, token)
                : await adminOmsActions.generateInvoice(orderId, token);
              doc = order?.documents?.find((item) => item.document_type === docType);
            }
            if (doc?.public_url) {
              window.open(doc.public_url, '_blank', 'noopener,noreferrer');
              successCount += 1;
            }
          }
        } catch {
          // continue with remaining orders
        }
      }

      invalidateSummary();
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });

      const labels = {
        invoice: 'invoices generated',
        invoices: 'invoices generated',
        label: 'labels generated',
        labels: 'labels generated',
        download: 'documents downloaded',
        'print-labels': 'labels opened for print',
        'print-invoices': 'invoices opened for print',
      };
      showToast(`${successCount} ${labels[type] || 'orders processed'}`);
    } catch (error) {
      showToast(error?.message || 'Bulk action failed', 'error');
    } finally {
      setBulkPending(null);
    }
  }, [invalidateSummary, orders, queryClient, selectedIds, token]);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(allSelected ? [] : orders.map((order) => order.id));
  }, [allSelected, orders]);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((current) => (
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    ));
  }, []);

  const handleStageCardClick = useCallback((cardId) => {
    if (OMS_TABS.some((item) => item.id === cardId)) {
      setActiveTab(cardId);
      setPage(1);
    }
  }, []);

  if (ordersQuery.isLoading && !orders.length) {
    return <LoadingState title="Loading order management…" />;
  }

  if (ordersQuery.isError) {
    return <ErrorState title="Unable to load orders" onRetry={() => ordersQuery.refetch()} />;
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        label="Admin"
        title="Order Management"
        description="Process orders stage by stage — accept, invoice, label, dispatch, and delivery."
        actions={(
          <Button
            variant="glass"
            onClick={() => exportAdminOrdersCsv({ status: tab.status, search }, token).then((csv) => {
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = 'orders-export.csv';
              link.click();
              URL.revokeObjectURL(url);
              showToast('CSV exported');
            })}
          >
            <Download className="size-4" /> Export CSV
          </Button>
        )}
      />

      <AdminOmsSummaryCards
        metrics={metrics}
        activeTab={activeTab}
        onCardSelect={handleStageCardClick}
      />

      <div className="flex flex-wrap gap-2">
        {OMS_TABS.map((item) => (
          <motion.button
            key={item.id}
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => { setActiveTab(item.id); setPage(1); }}
            className={cn(
              'rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200',
              activeTab === item.id
                ? 'border-primary bg-primary/15 text-primary shadow-[0_0_16px_rgba(139,92,246,0.15)]'
                : 'border-dashboard-border text-dashboard-muted hover:border-primary/30 hover:text-dashboard-foreground',
            )}
          >
            {item.label}
          </motion.button>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dashboard-muted" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search order, customer, phone, SKU, invoice…"
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'COMPLETED' ? (
            <Select
              value={completedPreset}
              onChange={(e) => { setCompletedPreset(e.target.value); setPage(1); }}
              className="w-[160px]"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="all">All Time</option>
            </Select>
          ) : null}
          <Select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="w-[160px]"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest_value">Highest Value</option>
            <option value="lowest_value">Lowest Value</option>
            <option value="priority">Priority</option>
          </Select>
        </div>
      </div>

      {activeTab === 'NEW_ORDERS' ? (
        <div className="flex flex-wrap gap-2 rounded-xl border border-dashboard-border/70 bg-dashboard-surface/60 p-3">
          <Button
            variant="glass"
            disabled={Boolean(bulkPending) || bulkAcceptMutation.isPending}
            onClick={() => bulkAcceptMutation.mutate(selectedIds.length ? selectedIds : orders.map((order) => order.id))}
          >
            {bulkPending === 'accept' ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            Accept All{selectedIds.length ? ` (${selectedIds.length})` : ''}
          </Button>
          <Button
            variant="glass"
            disabled={Boolean(bulkPending)}
            onClick={() => runBulkDocumentAction('labels')}
          >
            {bulkPending === 'labels' ? <Loader2 className="size-4 animate-spin" /> : <Tag className="size-4" />}
            Generate All Labels
          </Button>
          <Button
            variant="glass"
            disabled={Boolean(bulkPending)}
            onClick={() => runBulkDocumentAction('invoices')}
          >
            {bulkPending === 'invoices' ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
            Generate All Invoices
          </Button>
          <Button
            variant="glass"
            disabled={Boolean(bulkPending)}
            onClick={() => runBulkDocumentAction('download')}
          >
            {bulkPending === 'download' ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            Bulk Download
          </Button>
          <Button
            variant="glass"
            disabled={Boolean(bulkPending)}
            onClick={() => runBulkDocumentAction('print-labels')}
          >
            {bulkPending === 'print-labels' ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
            Bulk Print Labels
          </Button>
          <Button
            variant="glass"
            disabled={Boolean(bulkPending)}
            onClick={() => runBulkDocumentAction('print-invoices')}
          >
            {bulkPending === 'print-invoices' ? <Loader2 className="size-4 animate-spin" /> : <Printer className="size-4" />}
            Bulk Print Invoices
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-dashboard-border/80 bg-dashboard-surface shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
        <div className="max-h-[calc(100vh-22rem)] overflow-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="sticky top-0 z-10 bg-dashboard-surface-elevated text-left text-[11px] font-semibold uppercase tracking-wider text-dashboard-muted shadow-sm">
              <tr>
                {activeTab === 'NEW_ORDERS' ? (
                  <th className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className={formCheckboxClass}
                      aria-label="Select all orders"
                    />
                  </th>
                ) : null}
                <th className="px-3 py-3">Order</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">SKU ID</th>
                <th className="px-3 py-3">Product</th>
                <th className="px-3 py-3 text-center">Items</th>
                <th className="px-3 py-3">Total</th>
                <th className="px-3 py-3">Payment</th>
                <th className="px-3 py-3">Pay Status</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Ship To</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {orders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    activeTab={activeTab}
                    pendingAction={pendingAction}
                    showCheckbox={activeTab === 'NEW_ORDERS'}
                    selected={selectedIds.includes(order.id)}
                    onToggleSelect={() => toggleSelect(order.id)}
                    onAction={runOrderAction}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {!orders.length ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-4xl"
            >
              📦
            </motion.div>
            <p className="text-lg font-semibold text-dashboard-foreground">No Orders Found</p>
            <p className="text-sm text-dashboard-muted">You&apos;re all caught up.</p>
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-dashboard-border px-4 py-3 text-sm text-dashboard-muted">
          <span>{meta.total || 0} orders · Page {meta.page || page} of {meta.totalPages || 1}</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="glass"
              disabled={page <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="size-4" /> Previous
            </Button>
            <Button
              size="sm"
              variant="glass"
              disabled={page >= (meta.totalPages || 1)}
              onClick={() => setPage((current) => current + 1)}
            >
              Next <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
