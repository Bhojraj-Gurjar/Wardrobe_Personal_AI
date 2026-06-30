'use client';

import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Clock3,
  Download,
  IndianRupee,
  MoreHorizontal,
  Search,
  ShoppingBag,
  User,
  XCircle,
} from 'lucide-react';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import {
  AdminMetricCard,
  AdminPageHeader,
} from '@/features/admin/components/admin-metric-card';
import { AdminOrderDetailModal } from '@/features/admin/components/admin-order-detail-modal';
import {
  useAdminCancelOrderMutation,
  useAdminOrdersByUserQuery,
  useAdminOrdersQuery,
  useAdminOrdersSummaryQuery,
  useAdminToken,
  useAdminUpdateOrderStatusMutation,
} from '@/features/admin/hooks';
import { exportAdminOrdersCsv } from '@/features/admin/services';
import { formatProductPrice } from '@/features/products/utils/product-catalog.utils';
import {
  formatOrderDate,
  ORDER_STATUS_FILTERS,
  resolveOrderStatusConfig,
} from '@/features/orders/utils/order-status';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/utils/currency';
import { cn } from '@/utils/cn';

const DELETED_USER_LABEL = '[Deleted User]';

function resolveOrderUserDisplay(user) {
  if (!user?.name && !user?.email) {
    return {
      name: DELETED_USER_LABEL,
      email: 'Account removed',
      isDeleted: true,
    };
  }

  return {
    name: user?.name || DELETED_USER_LABEL,
    email: user?.email || 'Account removed',
    isDeleted: false,
  };
}

function OrderActionsMenu({ order, onView, onCancel }) {
  const [open, setOpen] = useState(false);
  const status = resolveOrderStatusConfig(order.status);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 text-dashboard-muted hover:text-dashboard-foreground"
        onClick={() => setOpen((current) => !current)}
      >
        <MoreHorizontal className="size-4" />
      </Button>
      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-xl border border-dashboard-border bg-dashboard-surface shadow-xl">
            <button
              type="button"
              className="block w-full px-4 py-2.5 text-left text-sm text-dashboard-foreground transition-colors hover:bg-dashboard-surface-elevated"
              onClick={() => {
                setOpen(false);
                onView(order);
              }}
            >
              View Details
            </button>
            {order.status !== 'CANCELLED' && !['DELIVERED', 'COMPLETED'].includes(order.status) ? (
              <button
                type="button"
                className="block w-full px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-red-500/10"
                onClick={() => {
                  setOpen(false);
                  onCancel(order.id);
                }}
              >
                Cancel Order
              </button>
            ) : null}
            <div className="border-t border-dashboard-border px-4 py-2 text-xs text-dashboard-muted">
              {status.label}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function UserOrderRow({ userRow, onViewOrder }) {
  const [expanded, setExpanded] = useState(false);
  const isDeletedUser = userRow.userId === '__deleted__' || userRow.name === DELETED_USER_LABEL;
  const avatarInitial = isDeletedUser
    ? '?'
    : userRow.name?.[0]?.toUpperCase() || '?';

  return (
    <div className="interactive-card overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-surface">
      <button
        type="button"
        className="flex w-full items-center gap-4 px-4 py-4 text-left transition-all duration-200 hover:bg-dashboard-bg/40 sm:px-5"
        onClick={() => setExpanded((current) => !current)}
      >
        <span className="text-dashboard-muted">
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </span>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
          {avatarInitial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-dashboard-foreground">{userRow.name}</p>
          <p className="truncate text-xs text-dashboard-muted">
            {userRow.email || 'Account removed'}
          </p>
        </div>
        <span className="hidden rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary sm:inline">
          {userRow.plan}
        </span>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-dashboard-foreground">
            {userRow.orderCount} orders
          </p>
          <p className="text-xs text-emerald-400">{userRow.deliveredCount} delivered</p>
        </div>
        <div className="hidden text-right md:block">
          <p className="text-sm font-bold text-dashboard-foreground">
            {formatCurrency(userRow.totalSpent)}
          </p>
          <p className="text-xs text-dashboard-muted">lifetime</p>
        </div>
        <div className="hidden text-right lg:block">
          <p className="text-sm text-dashboard-foreground">
            {formatOrderDate(userRow.lastOrderDate)}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize',
            userRow.status === 'active'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-dashboard-border bg-dashboard-bg text-dashboard-muted',
          )}
        >
          {userRow.status}
        </span>
      </button>
      {expanded && userRow.orders?.length ? (
        <div className="border-t border-dashboard-border bg-dashboard-bg/20">
          {userRow.orders.map((order) => {
            const status = resolveOrderStatusConfig(order.status);
            return (
              <button
                key={order.id}
                type="button"
                className="flex w-full items-center gap-4 border-t border-dashboard-border/60 px-4 py-3 text-left transition-colors hover:bg-dashboard-surface-elevated/50 sm:px-5"
                onClick={() => onViewOrder(order)}
              >
                <span className="min-w-0 flex-1 text-sm font-medium text-dashboard-foreground">
                  {order.order_number}
                </span>
                <span
                  className={cn(
                    'rounded-full border px-2 py-0.5 text-[10px] font-semibold',
                    status.badgeClass,
                  )}
                >
                  {order.display_status || status.label}
                </span>
                <span className="text-sm font-bold text-dashboard-foreground">
                  {formatProductPrice(order.total_amount)}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function AdminOrdersView() {
  const token = useAdminToken();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('orders');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [exporting, setExporting] = useState(false);

  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: statusFilter,
      page: 1,
      limit: 50,
    }),
    [search, statusFilter],
  );

  const summaryQuery = useAdminOrdersSummaryQuery();
  const ordersQuery = useAdminOrdersQuery(queryParams);
  const usersQuery = useAdminOrdersByUserQuery({ search: search.trim() || undefined });
  const updateStatus = useAdminUpdateOrderStatusMutation();
  const cancelOrder = useAdminCancelOrderMutation();

  const monthLabel = new Date().toLocaleString('en-IN', {
    month: 'long',
    year: 'numeric',
  });

  const isLoading = viewMode === 'orders' ? ordersQuery.isLoading : usersQuery.isLoading;
  const isError = viewMode === 'orders' ? ordersQuery.isError : usersQuery.isError;
  const refetch = viewMode === 'orders' ? ordersQuery.refetch : usersQuery.refetch;

  if (summaryQuery.isLoading && isLoading) {
    return <LoadingState title="Loading orders…" rows={4} />;
  }

  if (isError) {
    return <ErrorState title="Unable to load orders" onRetry={refetch} />;
  }

  const summary = summaryQuery.data || {};
  const orders = ordersQuery.data?.items || [];
  const userRows = usersQuery.data?.items || [];

  const statusCounts = summary.statusCounts || {};
  const filterCounts = {
    ALL: summary.totalOrders || 0,
    PENDING: (statusCounts.PENDING || 0) + (statusCounts.CREATED || 0),
    PROCESSING: (statusCounts.CONFIRMED || 0) + (statusCounts.PACKED || 0),
    SHIPPED: statusCounts.SHIPPED || 0,
    COMPLETED: (statusCounts.COMPLETED || 0) + (statusCounts.DELIVERED || 0),
    CANCELLED: statusCounts.CANCELLED || 0,
  };

  async function handleExportCsv() {
    if (!token) return;
    setExporting(true);
    try {
      const csv = await exportAdminOrdersCsv(queryParams, token);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders-export-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  function handleChangeStatus(orderId, status) {
    updateStatus.mutate(
      { id: orderId, status },
      {
        onSuccess: (updated) => {
          setSelectedOrder(updated);
        },
      },
    );
  }

  function handleCancel(orderId) {
    if (!window.confirm('Cancel this order?')) return;
    cancelOrder.mutate(orderId, {
      onSuccess: (updated) => {
        setSelectedOrder(updated);
      },
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        label="Admin"
        title="Order History"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-dashboard-muted">All user orders · {monthLabel}</p>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-dashboard-border bg-dashboard-surface hover:border-primary/40"
              disabled={exporting}
              onClick={handleExportCsv}
            >
              <Download className="size-4" />
              {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          title="Total Orders"
          value={summary.totalOrders ?? 0}
          icon={ShoppingBag}
        />
        <AdminMetricCard
          title="Total Revenue"
          value={summary.totalRevenue ?? 0}
          icon={IndianRupee}
          formatValue={formatCurrency}
        />
        <AdminMetricCard
          title="Active Orders"
          value={summary.activeOrders ?? 0}
          icon={Clock3}
        />
        <AdminMetricCard
          title="Cancelled"
          value={summary.cancelledOrders ?? 0}
          icon={XCircle}
        />
      </div>

      <div className="space-y-4 rounded-2xl border border-dashboard-border bg-dashboard-surface p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dashboard-muted" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users or order IDs…"
              className="h-11 border-dashboard-border bg-dashboard-bg pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={viewMode === 'users' ? 'default' : 'outline'}
              className="rounded-xl"
              onClick={() => setViewMode('users')}
            >
              <User className="size-4" />
              User View
            </Button>
            <Button
              type="button"
              variant={viewMode === 'orders' ? 'default' : 'outline'}
              className="rounded-xl"
              onClick={() => setViewMode('orders')}
            >
              <ShoppingBag className="size-4" />
              All Orders
            </Button>
          </div>
        </div>

        {viewMode === 'orders' ? (
          <div className="flex flex-wrap gap-2">
            {ORDER_STATUS_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200',
                  statusFilter === filter.id
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-dashboard-border bg-dashboard-bg text-dashboard-muted hover:border-primary/40 hover:text-dashboard-foreground',
                )}
                onClick={() => setStatusFilter(filter.id)}
              >
                {filter.label}
                {filterCounts[filter.id] != null ? ` ${filterCounts[filter.id]}` : ''}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {viewMode === 'users' ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-lg font-semibold text-dashboard-foreground">Orders by User</h3>
              <p className="text-sm text-dashboard-muted">Click any row to expand</p>
            </div>
            <p className="text-sm text-dashboard-muted">{userRows.length} users</p>
          </div>
          {userRows.map((userRow) => (
            <UserOrderRow
              key={userRow.userId}
              userRow={userRow}
              onViewOrder={setSelectedOrder}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-dashboard-border bg-dashboard-surface">
          <table className="min-w-[980px] w-full text-sm">
            <thead>
              <tr className="border-b border-dashboard-border text-left text-xs uppercase tracking-wide text-dashboard-muted">
                <th className="px-4 py-3 font-semibold">Order ID</th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Products</th>
                <th className="px-4 py-3 font-semibold">Qty</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const status = resolveOrderStatusConfig(order.status);
                const customer = resolveOrderUserDisplay(order.user);
                const productNames = (order.items || [])
                  .map((item) => item.product?.name)
                  .filter(Boolean)
                  .slice(0, 2)
                  .join(', ');

                return (
                  <tr
                    key={order.id}
                    className="interactive-surface border-b border-dashboard-border/70 transition-colors hover:bg-dashboard-bg/30"
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="font-semibold text-primary transition-colors hover:text-primary/80"
                        onClick={() => setSelectedOrder(order)}
                      >
                        {order.order_number}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p
                        className={cn(
                          'font-medium',
                          customer.isDeleted
                            ? 'text-dashboard-muted italic'
                            : 'text-dashboard-foreground',
                        )}
                      >
                        {customer.name}
                      </p>
                      <p className="text-xs text-dashboard-muted">{customer.email}</p>
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-dashboard-muted">
                      {productNames || '—'}
                    </td>
                    <td className="px-4 py-3 text-dashboard-foreground">{order.item_count ?? 0}</td>
                    <td className="px-4 py-3 font-semibold text-dashboard-foreground">
                      {formatProductPrice(order.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-dashboard-muted">
                      {formatOrderDate(order.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                          status.badgeClass,
                        )}
                      >
                        {order.display_status || status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <OrderActionsMenu
                        order={order}
                        onView={setSelectedOrder}
                        onCancel={handleCancel}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!orders.length ? (
            <p className="px-4 py-10 text-center text-sm text-dashboard-muted">
              No orders match your filters.
            </p>
          ) : null}
        </div>
      )}

      <AdminOrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onChangeStatus={handleChangeStatus}
        onCancel={handleCancel}
      />
    </div>
  );
}
