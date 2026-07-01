'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  IndianRupee,
  Receipt,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
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
import {
  useAdminAnalyticsOrdersDetailQuery,
  useAdminOrdersAnalyticsQuery,
} from '@/features/admin/hooks';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/currency';
import { CHART_TOOLTIP_STYLE } from '@/constants/charts';
import { BRAND_PURPLE, DASHBOARD_CHART_AXIS, DASHBOARD_CHART_GRID } from '@/constants/colors';

import { resolveAnalyticsPeriodRange } from '@/features/admin/utils/analytics-period.util';

const PERIOD_TO_QUERY = {
  today: resolveAnalyticsPeriodRange('today'),
  yesterday: resolveAnalyticsPeriodRange('yesterday'),
  week: resolveAnalyticsPeriodRange('week'),
  month: resolveAnalyticsPeriodRange('month'),
  quarter: resolveAnalyticsPeriodRange('quarter'),
  year: resolveAnalyticsPeriodRange('year'),
};

function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-dashboard-border bg-dashboard-surface px-3 py-2 text-sm shadow-lg">
      <p className="font-medium text-dashboard-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-dashboard-muted">
          {entry.name}: {entry.dataKey === 'revenue' ? formatCurrency(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

export function AdminRevenueAnalyticsView() {
  const [period, setPeriod] = useState('month');
  const params = useMemo(() => PERIOD_TO_QUERY[period] || {}, [period]);

  const ordersDetail = useAdminAnalyticsOrdersDetailQuery(params);
  const commerce = useAdminOrdersAnalyticsQuery();

  const isLoading = ordersDetail.isLoading || commerce.isLoading;
  const isError = ordersDetail.isError || commerce.isError;

  const summary = ordersDetail.data?.summary || {};
  const revenueTrend = ordersDetail.data?.revenueTrend || [];
  const ordersPerMonth = ordersDetail.data?.ordersPerMonth || [];
  const commerceData = commerce.data || {};

  const totalRevenue = summary.revenue ?? summary.netRevenue ?? commerceData.monthlyRevenue ?? 0;
  const grossRevenue = summary.grossRevenue ?? totalRevenue;
  const refundAmount = summary.refundAmount ?? commerceData.refundAmount ?? 0;
  const netRevenue = summary.netRevenue ?? totalRevenue;
  const averageOrderValue = summary.averageOrderValue ?? commerceData.averageOrderValue ?? 0;
  const totalOrders = summary.totalOrders ?? commerceData.totalOrders ?? 0;

  const exportRows = useMemo(() => {
    const header = 'Month,Orders,Revenue,Growth %';
    const rows = revenueTrend.map((row, index) => {
      const prev = revenueTrend[index - 1]?.revenue || 0;
      const growth = prev ? Math.round(((row.revenue - prev) / prev) * 100) : 0;
      return `${row.month},${row.orders ?? 0},${row.revenue ?? 0},${growth}`;
    });
    return [header, ...rows];
  }, [revenueTrend]);

  const tableRows = useMemo(() => revenueTrend.map((row, index) => {
    const prev = revenueTrend[index - 1]?.revenue || 0;
    const growth = prev ? Math.round(((row.revenue - prev) / prev) * 100) : 0;
    const refund = row.refundAmount ?? 0;
    return {
      ...row,
      refund,
      net: Math.max(0, (row.revenue || 0)),
      growth,
    };
  }), [revenueTrend]);

  const refetch = () => {
    ordersDetail.refetch();
    commerce.refetch();
  };

  if (isError) {
    return <ErrorState title="Unable to load revenue analytics" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        breadcrumb={(
          <AdminBreadcrumb
            className="mb-2"
            items={[
              { label: 'Admin', href: ROUTES.ADMIN.DASHBOARD },
              { label: 'Analytics', href: ROUTES.ADMIN.ANALYTICS },
              { label: 'Revenue' },
            ]}
          />
        )}
        label="Analytics"
        title="Revenue Analytics"
        actions={(
          <AdminAnalyticsToolbar
            onRefresh={refetch}
            isRefreshing={ordersDetail.isFetching || commerce.isFetching}
            exportRows={exportRows}
            exportFilename={`revenue-${period}.csv`}
          />
        )}
      />

      <div className="rounded-2xl border border-white/[0.08] bg-dashboard-surface/60 p-4 backdrop-blur-sm">
        <AdminAnalyticsPeriodFilters value={period} onChange={setPeriod} />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-2xl bg-dashboard-bg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AdminMetricCard title="Total Revenue" value={totalRevenue} icon={IndianRupee} formatValue={formatCurrency} sparklineData={revenueTrend.map((r) => r.revenue)} />
          <AdminMetricCard title="Gross Revenue" value={grossRevenue} icon={TrendingUp} formatValue={formatCurrency} />
          <AdminMetricCard title="Net Revenue" value={netRevenue} icon={Receipt} formatValue={formatCurrency} />
          <AdminMetricCard title="Refund Amount" value={refundAmount} icon={RotateCcw} formatValue={formatCurrency} />
          <AdminMetricCard title="Average Order Value" value={averageOrderValue} icon={ShoppingBag} formatValue={formatCurrency} />
          <AdminMetricCard title="Total Orders" value={totalOrders} icon={ShoppingBag} />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.08] bg-dashboard-surface/60 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold">Monthly Revenue</h3>
          <div className="h-72">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-xl bg-dashboard-bg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND_PURPLE} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={BRAND_PURPLE} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={DASHBOARD_CHART_GRID} strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                  <YAxis stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(value, name) => (
                      name === 'Revenue' || name === 'revenue'
                        ? formatCurrency(Number(value) || 0)
                        : value
                    )}
                  />
                  <Area type="linear" dataKey="revenue" stroke={BRAND_PURPLE} fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-dashboard-surface/60 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold">Orders vs Revenue</h3>
          <div className="h-72">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-xl bg-dashboard-bg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersPerMonth}>
                  <CartesianGrid stroke={DASHBOARD_CHART_GRID} strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                  <YAxis yAxisId="orders" stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                  <YAxis yAxisId="revenue" orientation="right" stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(value, name) => (
                      name === 'Revenue' || name === 'revenue'
                        ? formatCurrency(Number(value) || 0)
                        : value
                    )}
                  />
                  <Bar yAxisId="orders" dataKey="orders" fill={BRAND_PURPLE} radius={[6, 6, 0, 0]} name="Orders" />
                  <Bar yAxisId="revenue" dataKey="revenue" fill="#6366F1" radius={[6, 6, 0, 0]} name="Revenue" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-dashboard-surface/60 p-5 backdrop-blur-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Revenue Table</h3>
          <Button asChild variant="glass" size="sm">
            <Link href={ROUTES.ADMIN.ORDERS}>View Orders</Link>
          </Button>
        </div>
        {!tableRows.length ? (
          <div className="py-12 text-center">
            <p className="text-sm text-dashboard-muted">No revenue yet</p>
            <Button asChild className="mt-4" size="sm">
              <Link href={ROUTES.ADMIN.ORDERS}>View Orders</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-dashboard-muted">
                  <th className="pb-2 pr-3">Date</th>
                  <th className="pb-2 pr-3">Orders</th>
                  <th className="pb-2 pr-3">Revenue</th>
                  <th className="pb-2 pr-3">Refund</th>
                  <th className="pb-2 pr-3">Net</th>
                  <th className="pb-2">Growth %</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.month} className="border-t border-white/[0.06]">
                    <td className="py-2.5 pr-3 font-medium">{row.month}</td>
                    <td className="py-2.5 pr-3">{row.orders ?? 0}</td>
                    <td className="py-2.5 pr-3">{formatCurrency(row.revenue ?? 0)}</td>
                    <td className="py-2.5 pr-3">{formatCurrency(row.refund)}</td>
                    <td className="py-2.5 pr-3">{formatCurrency(row.net)}</td>
                    <td className="py-2.5">{row.growth}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
