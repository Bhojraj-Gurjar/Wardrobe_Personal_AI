'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  BarChart3,
  Headphones,
  IndianRupee,
  Package,
  PackagePlus,
  ShoppingBag,
  Ticket,
  Users,
} from 'lucide-react';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useAdminOrdersAnalyticsQuery, useAdminOrdersQuery } from '@/features/admin/hooks';
import { formatOrderDate, resolveOrderStatusConfig } from '@/features/orders/utils/order-status';
import { formatProductPrice } from '@/features/products/utils/product-catalog.utils';
import { formatCurrency } from '@/utils/currency';
import { cn } from '@/utils/cn';

const QUICK_ACTIONS = [
  { label: 'Add Product', href: ROUTES.ADMIN.PRODUCTS, icon: PackagePlus },
  { label: 'Manage Orders', href: ROUTES.ADMIN.ORDERS, icon: ShoppingBag },
  { label: 'Manage Users', href: ROUTES.ADMIN.USERS, icon: Users },
  { label: 'Support Tickets', href: ROUTES.ADMIN.SUPPORT, icon: Headphones },
  { label: 'Analytics', href: ROUTES.ADMIN.ANALYTICS, icon: BarChart3 },
  { label: 'Revenue', href: ROUTES.ADMIN.ANALYTICS_REVENUE, icon: IndianRupee },
  { label: 'Export Reports', href: ROUTES.ADMIN.ANALYTICS_ORDERS, icon: Ticket },
];

function PanelShell({ title, description, action, children, className }) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-white/[0.08] bg-dashboard-surface/60 p-5',
        'shadow-[0_8px_32px_rgba(0,0,0,0.18)] backdrop-blur-sm',
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-dashboard-foreground">{title}</h3>
          {description ? <p className="mt-0.5 text-sm text-dashboard-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function AdminQuickActionsPanel() {
  return (
    <PanelShell title="Quick Actions" description="Shortcuts to common admin tasks">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3',
                'transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/10 hover:shadow-[0_8px_24px_rgba(124,58,237,0.15)]',
              )}
            >
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary transition group-hover:scale-105">
                <Icon className="size-4" />
              </span>
              <span className="text-sm font-medium text-dashboard-foreground">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </PanelShell>
  );
}

export function AdminRecentOrdersWidget() {
  const { data, isLoading } = useAdminOrdersQuery({ page: 1, limit: 6, sort: 'newest' });
  const orders = data?.items || [];

  return (
    <PanelShell
      title="Recent Orders"
      description="Latest platform orders"
      action={(
        <Link href={ROUTES.ADMIN.ORDERS} className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      )}
    >
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-xl bg-dashboard-bg" />
          ))}
        </div>
      ) : !orders.length ? (
        <p className="py-8 text-center text-sm text-dashboard-muted">No orders yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-dashboard-muted">
                <th className="pb-2 pr-3 font-semibold">Order</th>
                <th className="pb-2 pr-3 font-semibold">Customer</th>
                <th className="pb-2 pr-3 font-semibold">Amount</th>
                <th className="pb-2 pr-3 font-semibold">Status</th>
                <th className="pb-2 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const status = resolveOrderStatusConfig(order.status);
                return (
                  <tr
                    key={order.id}
                    className="border-t border-white/[0.06] transition-colors hover:bg-white/[0.03]"
                  >
                    <td className="py-2.5 pr-3">
                      <Link href={ROUTES.ADMIN.ORDERS} className="font-medium text-primary hover:underline">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3 text-dashboard-foreground">
                      {order.user?.name || order.user?.email || '—'}
                    </td>
                    <td className="py-2.5 pr-3 font-semibold tabular-nums">
                      {formatProductPrice(order.total_amount)}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', status.badgeClass)}>
                        {order.display_status || status.label}
                      </span>
                    </td>
                    <td className="py-2.5 text-dashboard-muted">{formatOrderDate(order.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PanelShell>
  );
}

export function AdminTopProductsWidget() {
  const { data, isLoading } = useAdminOrdersAnalyticsQuery();
  const products = data?.topProducts || [];

  return (
    <PanelShell
      title="Top Products"
      description="Best sellers by units"
      action={(
        <Link href={ROUTES.ADMIN.ANALYTICS_PRODUCTS} className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      )}
    >
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl bg-dashboard-bg" />
          ))}
        </div>
      ) : !products.length ? (
        <p className="py-8 text-center text-sm text-dashboard-muted">No product sales yet</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {products.slice(0, 4).map((product) => (
            <Link
              key={product.productId}
              href={ROUTES.ADMIN.PRODUCTS}
              className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 transition hover:border-primary/30 hover:bg-primary/5"
            >
              <span className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Package className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-dashboard-foreground">{product.name}</p>
                <p className="text-xs text-dashboard-muted">{product.brand || 'Product'}</p>
                <p className="mt-1 text-xs font-medium text-primary">{product.quantitySold} sold</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PanelShell>
  );
}

export function AdminTopCustomersWidget() {
  const { data, isLoading } = useAdminOrdersAnalyticsQuery();
  const customers = data?.topCustomers || [];

  return (
    <PanelShell
      title="Top Customers"
      description="Highest lifetime spend"
      action={(
        <Link href={ROUTES.ADMIN.ANALYTICS_CUSTOMERS} className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      )}
    >
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-xl bg-dashboard-bg" />
          ))}
        </div>
      ) : !customers.length ? (
        <p className="py-8 text-center text-sm text-dashboard-muted">No customer data yet</p>
      ) : (
        <div className="space-y-2">
          {customers.slice(0, 5).map((customer) => (
            <Link
              key={customer.userId}
              href={ROUTES.ADMIN.USERS}
              className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition hover:border-primary/30 hover:bg-primary/5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar name={customer.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-dashboard-foreground">{customer.name}</p>
                  <p className="text-xs text-dashboard-muted">{customer.orderCount} orders</p>
                </div>
              </div>
              <span className="shrink-0 text-sm font-bold text-dashboard-foreground">
                {formatCurrency(customer.totalSpent)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </PanelShell>
  );
}

const ACTIVITY_LABELS = {
  CREATED: 'New order placed',
  CONFIRMED: 'Order accepted',
  PACKED: 'Order packed',
  SHIPPED: 'Order dispatched',
  DELIVERED: 'Order delivered',
  COMPLETED: 'Order completed',
  CANCELLED: 'Order cancelled',
  RETURNED: 'Return requested',
};

export function AdminActivityTimelineWidget() {
  const { data, isLoading } = useAdminOrdersQuery({ page: 1, limit: 8, sort: 'newest' });
  const orders = data?.items || [];

  const events = orders.map((order) => ({
    id: order.id,
    label: ACTIVITY_LABELS[order.status] || `Order ${order.display_status || order.status}`,
    detail: order.order_number,
    time: order.created_at,
  }));

  return (
    <PanelShell title="Activity Timeline" description="Recent platform events">
      {isLoading ? (
        <div className="space-y-3 pl-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full rounded-lg bg-dashboard-bg" />
          ))}
        </div>
      ) : !events.length ? (
        <p className="py-8 text-center text-sm text-dashboard-muted">No recent activity</p>
      ) : (
        <div className="relative space-y-0 pl-3">
          <div className="absolute bottom-2 left-[7px] top-2 w-px bg-primary/25" aria-hidden="true" />
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              className="relative flex gap-3 pb-4 last:pb-0"
            >
              <span className="relative z-[1] mt-1.5 size-3.5 shrink-0 rounded-full border-2 border-primary bg-dashboard-surface" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-dashboard-foreground">{event.label}</p>
                <p className="text-xs text-dashboard-muted">
                  {event.detail}
                  {' · '}
                  {formatOrderDate(event.time)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PanelShell>
  );
}
