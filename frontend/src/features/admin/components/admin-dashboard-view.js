'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
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
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/shared/error-state';
import {
  AdminMetricCard,
  AdminPageHeader,
} from '@/features/admin/components/admin-metric-card';
import { AdminAnalyticsChartCard } from '@/features/admin/components/admin-analytics-chart-card';
import { useAdminDashboardQuery } from '@/features/admin/hooks';
import { ROUTES } from '@/constants/routes';
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from '@/constants/charts';
import { BRAND_PURPLE, DASHBOARD_CHART_AXIS, DASHBOARD_CHART_GRID } from '@/constants/colors';
import { formatCurrency } from '@/utils/currency';

const AdminRecentOrdersWidget = dynamic(
  () => import('@/features/admin/components/admin-dashboard-widgets').then((mod) => mod.AdminRecentOrdersWidget),
  { loading: () => <Skeleton className="h-64 rounded-2xl bg-dashboard-bg" /> },
);
const AdminTopProductsWidget = dynamic(
  () => import('@/features/admin/components/admin-dashboard-widgets').then((mod) => mod.AdminTopProductsWidget),
  { loading: () => <Skeleton className="h-64 rounded-2xl bg-dashboard-bg" /> },
);
const AdminTopCustomersWidget = dynamic(
  () => import('@/features/admin/components/admin-dashboard-widgets').then((mod) => mod.AdminTopCustomersWidget),
  { loading: () => <Skeleton className="h-64 rounded-2xl bg-dashboard-bg" /> },
);
const AdminActivityTimelineWidget = dynamic(
  () => import('@/features/admin/components/admin-dashboard-widgets').then((mod) => mod.AdminActivityTimelineWidget),
  { loading: () => <Skeleton className="h-64 rounded-2xl bg-dashboard-bg" /> },
);
const AdminQuickActionsPanel = dynamic(
  () => import('@/features/admin/components/admin-dashboard-widgets').then((mod) => mod.AdminQuickActionsPanel),
  { loading: () => <Skeleton className="h-40 rounded-2xl bg-dashboard-bg" /> },
);

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-full max-w-md rounded-xl bg-dashboard-bg" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-40 rounded-2xl bg-dashboard-bg" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Skeleton className="h-80 rounded-2xl bg-dashboard-bg xl:col-span-2" />
        <Skeleton className="h-80 rounded-2xl bg-dashboard-bg" />
      </div>
    </div>
  );
}

import { formatCurrency } from '@/utils/currency';

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

export function AdminDashboardView() {
  const { data, isLoading, isError, error, refetch, isFetched } = useAdminDashboardQuery();

  if (isLoading && !isFetched) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    const description = error?.message
      || 'The admin dashboard API did not return data. Check that you are signed in as an admin and the API is running.';

    return (
      <ErrorState
        title="Unable to load dashboard"
        description={description}
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

  const cards = data?.cards || {};
  const monthLabel = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const revenueSparkline = (data?.revenueUsersChart || []).map((item) => item.revenue);
  const usersSparkline = (data?.revenueUsersChart || []).map((item) => item.users);

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
          href={ROUTES.ADMIN.ANALYTICS_REVENUE}
          sparklineData={revenueSparkline}
        />
        <AdminMetricCard
          title="Active Users"
          value={cards.activeUsers?.value ?? 0}
          trend={cards.activeUsers?.trend}
          icon={Users}
          href={ROUTES.ADMIN.ANALYTICS_USERS}
          sparklineData={usersSparkline}
        />
        <AdminMetricCard
          title="Orders This Month"
          value={cards.ordersThisMonth?.value ?? 0}
          trend={cards.ordersThisMonth?.trend}
          icon={ShoppingBag}
          href={ROUTES.ADMIN.ORDERS_ANALYTICS}
          sparklineData={(data?.revenueUsersChart || []).map((item) => item.orders ?? 0)}
        />
        <AdminMetricCard
          title="Conversion Rate"
          value={`${cards.conversionRate?.value ?? 0}%`}
          trend={cards.conversionRate?.trend}
          icon={TrendingUp}
          href={ROUTES.ADMIN.ANALYTICS_CONVERSION}
        />
      </div>

      <AdminAnalyticsChartCard
        title="Revenue Analytics"
        description={`Monthly performance · ${monthLabel.split(' ')[1]}`}
        href={ROUTES.ADMIN.ANALYTICS_REVENUE}
      >
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
              <Tooltip content={<RevenueTooltip />} />
              <Area
                type="linear"
                dataKey="revenue"
                stroke={BRAND_PURPLE}
                fill="url(#revenueGrad)"
                strokeWidth={2}
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </AdminAnalyticsChartCard>

      <AdminAnalyticsChartCard
        title="User Growth"
        description="New users over the last 6 months"
        href={ROUTES.ADMIN.ANALYTICS_USERS}
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.revenueUsersChart || []}>
              <defs>
                <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366F1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={DASHBOARD_CHART_GRID} strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
              <YAxis stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#6366F1"
                fill="url(#usersGrad)"
                strokeWidth={2}
                name="Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </AdminAnalyticsChartCard>

      <AdminAnalyticsChartCard
        title="Orders Analytics"
        description="Order volume and fulfillment overview"
        href={ROUTES.ADMIN.ORDERS_ANALYTICS}
      >
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02] text-center">
          <p className="text-sm text-dashboard-muted">
            {cards.ordersThisMonth?.value ?? 0} orders this month
          </p>
          <Link href={ROUTES.ADMIN.ORDERS_ANALYTICS} className="mt-2 text-sm font-medium text-primary hover:underline">
            Open order analytics →
          </Link>
        </div>
      </AdminAnalyticsChartCard>

      <AdminAnalyticsChartCard
        title="Sales by Category"
        description={monthLabel}
        href={ROUTES.ADMIN.ANALYTICS_CATEGORIES}
        isEmpty={!(data?.salesByCategory || []).length}
        emptyMessage="No category sales yet"
      >
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
      </AdminAnalyticsChartCard>

      <AdminTopProductsWidget />
      <AdminRecentOrdersWidget />
      <AdminTopCustomersWidget />
      <AdminActivityTimelineWidget />
      <AdminQuickActionsPanel />
    </div>
  );
}
