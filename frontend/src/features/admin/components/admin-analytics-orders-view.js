'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { IndianRupee, Package, RotateCcw, ShoppingBag } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { AdminBreadcrumb } from '@/features/admin/components/admin-breadcrumb';
import {
  AdminAnalyticsPeriodFilters,
  AdminAnalyticsToolbar,
} from '@/features/admin/components/admin-analytics-toolbar';
import { AdminMetricCard, AdminPageHeader } from '@/features/admin/components/admin-metric-card';
import { useAdminAnalyticsOrdersDetailQuery, useAdminOrdersAnalyticsQuery } from '@/features/admin/hooks';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/currency';
import { CHART_TOOLTIP_STYLE } from '@/constants/charts';
import { BRAND_PURPLE, DASHBOARD_CHART_AXIS, DASHBOARD_CHART_GRID } from '@/constants/colors';

export function AdminAnalyticsOrdersView({ variant = 'analytics' }) {
  const [period, setPeriod] = useState('month');
  const [status, setStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const params = useMemo(() => ({
    status: status || undefined,
    paymentMethod: paymentMethod || undefined,
  }), [status, paymentMethod]);

  const { data, isLoading, isError, refetch, isFetching } = useAdminAnalyticsOrdersDetailQuery(params);
  const commerce = useAdminOrdersAnalyticsQuery();
  const summary = data?.summary || {};
  const ordersPerMonth = data?.ordersPerMonth || [];
  const revenueTrend = data?.revenueTrend || [];
  const statusDistribution = data?.statusDistribution || [];
  const commerceData = commerce.data || {};

  const exportRows = useMemo(() => {
    const header = 'Month,Orders,Completed,Cancelled,Returned,Revenue';
    return [
      header,
      ...ordersPerMonth.map((row) => `${row.month},${row.orders ?? 0},${row.completed ?? 0},${row.cancelled ?? 0},${row.returned ?? 0},${row.revenue ?? 0}`),
    ];
  }, [ordersPerMonth]);

  const breadcrumbItems = variant === 'orders'
    ? [
        { label: 'Admin', href: ROUTES.ADMIN.DASHBOARD },
        { label: 'Orders', href: ROUTES.ADMIN.ORDERS },
        { label: 'Analytics' },
      ]
    : [
        { label: 'Admin', href: ROUTES.ADMIN.DASHBOARD },
        { label: 'Analytics', href: ROUTES.ADMIN.ANALYTICS },
        { label: 'Orders' },
      ];

  if (isError) {
    return <ErrorState title="Unable to load order analytics" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {variant === 'analytics' ? (
        <Button asChild variant="glass" size="sm">
          <Link href={ROUTES.ADMIN.ANALYTICS}>
            Back to Analytics
          </Link>
        </Button>
      ) : null}

      <AdminPageHeader
        breadcrumb={<AdminBreadcrumb className="mb-2" items={breadcrumbItems} />}
        label={variant === 'orders' ? 'Orders' : 'Analytics'}
        title="Order Analytics"
        actions={(
          <AdminAnalyticsToolbar
            onRefresh={() => {
              refetch();
              commerce.refetch();
            }}
            isRefreshing={isFetching || commerce.isFetching}
            exportRows={exportRows}
            exportFilename={`orders-${period}.csv`}
          />
        )}
      />

      <div className="rounded-2xl border border-white/[0.08] bg-dashboard-surface/60 p-4 backdrop-blur-sm">
        <AdminAnalyticsPeriodFilters value={period} onChange={setPeriod} className="mb-3" />
        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-xl border border-dashboard-border bg-dashboard-bg px-3 text-sm"
          >
            <option value="">All statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RETURNED">Returned</option>
          </select>
          <select
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            className="h-10 rounded-xl border border-dashboard-border bg-dashboard-bg px-3 text-sm"
          >
            <option value="">All payment methods</option>
            <option value="COD">COD</option>
            <option value="UPI">UPI</option>
            <option value="CREDIT_CARD">Credit Card</option>
            <option value="DEBIT_CARD">Debit Card</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-2xl bg-dashboard-bg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <AdminMetricCard title="Total Orders" value={summary.totalOrders ?? commerceData.totalOrders ?? 0} icon={ShoppingBag} sparklineData={ordersPerMonth.map((r) => r.orders)} />
          <AdminMetricCard title="Delivered" value={summary.delivered ?? 0} icon={Package} />
          <AdminMetricCard title="Cancelled" value={summary.cancelled ?? 0} icon={RotateCcw} />
          <AdminMetricCard title="Returned" value={summary.returned ?? 0} icon={RotateCcw} />
          <AdminMetricCard
            title="Revenue"
            value={summary.revenue ?? commerceData.monthlyRevenue ?? 0}
            icon={IndianRupee}
            formatValue={formatCurrency}
          />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.08] bg-dashboard-surface/60 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold">Orders Per Day</h3>
          <div className="h-72">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-xl bg-dashboard-bg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersPerMonth}>
                  <CartesianGrid stroke={DASHBOARD_CHART_GRID} strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                  <YAxis stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Bar dataKey="orders" fill={BRAND_PURPLE} radius={[6, 6, 0, 0]} />
                  <Bar dataKey="completed" fill="#6366F1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="cancelled" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="returned" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-dashboard-surface/60 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold">Revenue Trend</h3>
          <div className="h-72">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-xl bg-dashboard-bg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrend}>
                  <CartesianGrid stroke={DASHBOARD_CHART_GRID} strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                  <YAxis stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="revenue" stroke={BRAND_PURPLE} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-dashboard-surface/60 p-5 backdrop-blur-sm">
        <h3 className="mb-4 text-lg font-semibold">Orders By Status</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusDistribution}>
              <CartesianGrid stroke={DASHBOARD_CHART_GRID} strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
              <YAxis stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#6366F1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {(commerceData.topProducts?.length || commerceData.topCustomers?.length) ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-white/[0.08] bg-dashboard-surface/60 p-5 backdrop-blur-sm">
            <h3 className="mb-4 text-lg font-semibold">Top Selling Products</h3>
            <div className="space-y-2">
              {(commerceData.topProducts || []).map((product) => (
                <Link
                  key={product.productId}
                  href={ROUTES.ADMIN.PRODUCTS}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] px-3 py-2 transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <span className="text-sm font-medium">{product.name}</span>
                  <span className="text-xs text-primary">{product.quantitySold} sold</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-dashboard-surface/60 p-5 backdrop-blur-sm">
            <h3 className="mb-4 text-lg font-semibold">Top Customers</h3>
            <div className="space-y-2">
              {(commerceData.topCustomers || []).map((customer) => (
                <Link
                  key={customer.userId}
                  href={ROUTES.ADMIN.USERS}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] px-3 py-2 transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <span className="text-sm font-medium">{customer.name}</span>
                  <span className="text-xs text-dashboard-muted">{customer.orderCount} orders</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

