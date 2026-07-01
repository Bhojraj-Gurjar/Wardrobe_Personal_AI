'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, UserPlus, Users } from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
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
import { AdminBreadcrumb } from '@/features/admin/components/admin-breadcrumb';
import {
  AdminAnalyticsPeriodFilters,
  AdminAnalyticsToolbar,
} from '@/features/admin/components/admin-analytics-toolbar';
import { AdminMetricCard, AdminPageHeader } from '@/features/admin/components/admin-metric-card';
import {
  useAdminAnalyticsDevicesQuery,
  useAdminAnalyticsUserGrowthQuery,
} from '@/features/admin/hooks';
import { ROUTES } from '@/constants/routes';
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from '@/constants/charts';
import { BRAND_PURPLE, DASHBOARD_CHART_AXIS, DASHBOARD_CHART_GRID } from '@/constants/colors';

const PERIOD_MAP = {
  today: 'weekly',
  week: 'weekly',
  month: 'monthly',
  quarter: 'quarterly',
  year: 'yearly',
};

export function AdminUsersAnalyticsView() {
  const [period, setPeriod] = useState('month');
  const queryPeriod = PERIOD_MAP[period] || 'monthly';

  const growth = useAdminAnalyticsUserGrowthQuery({ period: queryPeriod });
  const devices = useAdminAnalyticsDevicesQuery();

  const isLoading = growth.isLoading || devices.isLoading;
  const isError = growth.isError || devices.isError;

  const summary = growth.data?.summary || {};
  const chartData = growth.data?.series?.[queryPeriod] || growth.data?.series?.monthly || [];
  const deviceSplit = devices.data?.deviceSplit || [];
  const browserDistribution = devices.data?.browserDistribution || [];
  const osDistribution = devices.data?.osDistribution || [];

  const exportRows = useMemo(() => {
    const header = 'Month,New Users,Returning,Total,Growth %';
    return [
      header,
      ...chartData.map((row) => `${row.month},${row.newUsers ?? 0},${row.returningUsers ?? 0},${row.totalUsers ?? 0},${row.growthPercent ?? 0}`),
    ];
  }, [chartData]);

  const refetch = () => {
    growth.refetch();
    devices.refetch();
  };

  if (isError) {
    return <ErrorState title="Unable to load user analytics" onRetry={refetch} />;
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
              { label: 'Users' },
            ]}
          />
        )}
        label="Analytics"
        title="User Analytics"
        actions={(
          <AdminAnalyticsToolbar
            onRefresh={refetch}
            isRefreshing={growth.isFetching || devices.isFetching}
            exportRows={exportRows}
            exportFilename={`users-${period}.csv`}
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
          <AdminMetricCard title="Active Users" value={summary.activeUsers ?? 0} icon={Users} sparklineData={chartData.map((r) => r.totalUsers)} />
          <AdminMetricCard title="New Users" value={summary.newUsers ?? 0} icon={UserPlus} />
          <AdminMetricCard title="Returning Users" value={summary.returningUsers ?? 0} icon={Users} />
          <AdminMetricCard title="Total Users" value={summary.totalUsers ?? 0} icon={Users} />
          <AdminMetricCard title="Conversion Rate" value={`${summary.growthPercent ?? 0}%`} icon={TrendingUp} />
          <AdminMetricCard title="Retention Rate" value={`${summary.retentionRate ?? Math.min(100, (summary.returningUsers || 0) * 10)}%`} icon={TrendingUp} />
        </div>
      )}

      <div className="rounded-2xl border border-white/[0.08] bg-dashboard-surface/60 p-5 backdrop-blur-sm">
        <h3 className="mb-4 text-lg font-semibold">User Growth</h3>
        <div className="h-80">
          {isLoading ? (
            <Skeleton className="h-full w-full rounded-xl bg-dashboard-bg" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid stroke={DASHBOARD_CHART_GRID} strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <YAxis stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="newUsers" stroke={BRAND_PURPLE} fill={`${BRAND_PURPLE}33`} strokeWidth={2} />
                <Area type="monotone" dataKey="returningUsers" stroke="#6366F1" fill="#6366F133" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.08] bg-dashboard-surface/60 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold">Device Usage</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deviceSplit} dataKey="value" nameKey="device" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {deviceSplit.map((entry, index) => (
                    <Cell key={entry.device} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-dashboard-surface/60 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold">Browser Usage</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={browserDistribution.slice(0, 5)} layout="vertical">
                <CartesianGrid stroke={DASHBOARD_CHART_GRID} strokeDasharray="3 3" />
                <XAxis type="number" stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <YAxis type="category" dataKey="label" stroke={DASHBOARD_CHART_AXIS} fontSize={11} width={80} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="value" fill={BRAND_PURPLE} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-dashboard-surface/60 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold">OS Distribution</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={osDistribution.slice(0, 5)}>
                <CartesianGrid stroke={DASHBOARD_CHART_GRID} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={DASHBOARD_CHART_AXIS} fontSize={11} />
                <YAxis stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="value" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Link href={ROUTES.ADMIN.ANALYTICS_USER_GROWTH} className="text-sm font-medium text-primary hover:underline">
          View detailed user growth →
        </Link>
      </div>
    </div>
  );
}
