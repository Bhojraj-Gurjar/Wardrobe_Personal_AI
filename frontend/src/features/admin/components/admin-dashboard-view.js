'use client';

import {
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import {
  AdminMetricCard,
  AdminPageHeader,
} from '@/features/admin/components/admin-metric-card';
import { useAdminDashboardQuery } from '@/features/admin/hooks';

import { CHART_COLORS, CHART_TOOLTIP_STYLE } from '@/constants/charts';
import { BRAND_PURPLE, DASHBOARD_CHART_AXIS, DASHBOARD_CHART_GRID } from '@/constants/colors';

import { formatCurrency } from '@/utils/currency';

export function AdminDashboardView() {
  const { data, isLoading, isError, error, refetch, isFetched } = useAdminDashboardQuery();

  if (isLoading && !isFetched) {
    return <LoadingState title="Loading dashboard…" rows={4} />;
  }

  if (isError) {
    const description = error?.message
      || 'The admin dashboard API did not return data. Check that you are signed in as an admin and the API is running.';

    if (process.env.NODE_ENV === 'development') {
      console.error('[Admin] Dashboard load failed:', error);
    }

    return (
      <ErrorState
        title="Unable to load dashboard"
        description={
          process.env.NODE_ENV === 'development'
            ? `${description}${error?.status ? ` (HTTP ${error.status})` : ''}`
            : description
        }
        onRetry={refetch}
      />
    );
  }

  if (!data?.cards) {
    return (
      <ErrorState
        title="Dashboard data unavailable"
        description="The server responded without dashboard metrics. Try again or check backend logs."
        onRetry={refetch}
      />
    );
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[Admin] ✔ Dashboard rendered');
  }

  const cards = data?.cards || {};
  const monthLabel = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        label="Overview"
        title="Overview Dashboard"
        action={
          <p className="text-sm text-dashboard-muted">Platform performance · {monthLabel}</p>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          title="Total Revenue"
          value={cards.revenue?.value ?? 0}
          trend={cards.revenue?.trend}
          icon={IndianRupee}
          formatValue={formatCurrency}
        />
        <AdminMetricCard
          title="Active Users"
          value={cards.activeUsers?.value ?? 0}
          trend={cards.activeUsers?.trend}
          icon={Users}
        />
        <AdminMetricCard
          title="Orders This Month"
          value={cards.ordersThisMonth?.value ?? 0}
          trend={cards.ordersThisMonth?.trend}
          icon={ShoppingBag}
        />
        <AdminMetricCard
          title="Conversion Rate"
          value={`${cards.conversionRate?.value ?? 0}%`}
          trend={cards.conversionRate?.trend}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-5 xl:col-span-2">
          <h3 className="text-lg font-semibold text-dashboard-foreground">Revenue & Users</h3>
          <p className="mb-4 text-sm text-dashboard-muted">Monthly performance · {monthLabel.split(' ')[1]}</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.revenueUsersChart || []}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND_PURPLE} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={BRAND_PURPLE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={DASHBOARD_CHART_GRID} strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <YAxis stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={BRAND_PURPLE}
                  fill="url(#revenueGrad)"
                  strokeWidth={2}
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="users"
                  stroke="#6366F1"
                  fill="transparent"
                  strokeWidth={2}
                  name="Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-5">
          <h3 className="text-lg font-semibold text-dashboard-foreground">Sales by Category</h3>
          <p className="mb-4 text-sm text-dashboard-muted">{monthLabel}</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.salesByCategory || []}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {(data?.salesByCategory || []).map((entry, index) => (
                    <Cell
                      key={entry.category}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1">
            {(data?.salesByCategory || []).slice(0, 4).map((item, index) => (
              <div key={item.category} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-dashboard-muted">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  {item.category}
                </span>
                <span className="text-dashboard-foreground">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
