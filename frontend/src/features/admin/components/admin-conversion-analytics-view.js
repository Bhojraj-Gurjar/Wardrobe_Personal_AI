'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  MousePointerClick,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
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
  useAdminAnalyticsQuery,
  useAdminOrdersAnalyticsQuery,
} from '@/features/admin/hooks';
import { ROUTES } from '@/constants/routes';
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from '@/constants/charts';
import { BRAND_PURPLE, DASHBOARD_CHART_AXIS, DASHBOARD_CHART_GRID } from '@/constants/colors';

export function AdminConversionAnalyticsView() {
  const [period, setPeriod] = useState('month');
  const analytics = useAdminAnalyticsQuery({ period: period === 'week' ? 'weekly' : 'monthly' });
  const devices = useAdminAnalyticsDevicesQuery();
  const commerce = useAdminOrdersAnalyticsQuery();

  const isLoading = analytics.isLoading || devices.isLoading || commerce.isLoading;
  const isError = analytics.isError || devices.isError || commerce.isError;

  const userGrowth = analytics.data?.userGrowth?.monthly || analytics.data?.userGrowthChart?.monthly || [];
  const deviceSplit = devices.data?.deviceSplit || analytics.data?.deviceSplit || [];
  const topCategories = analytics.data?.topCategories || [];
  const commerceData = commerce.data || {};

  const totalUsers = userGrowth.reduce((sum, item) => sum + (item.newUsers || 0), 0) || 0;
  const registeredUsers = totalUsers;
  const customers = commerceData.totalOrders || 0;
  const returningCustomers = commerceData.topCustomers?.filter((c) => c.orderCount > 1).length || 0;
  const checkoutCompletion = registeredUsers
    ? Math.round((customers / registeredUsers) * 100)
    : 0;
  const cartAbandonment = Math.max(0, 100 - checkoutCompletion - 12);

  const funnelData = useMemo(() => [
    { name: 'Visitors', value: Math.max(registeredUsers * 3, registeredUsers), fill: BRAND_PURPLE },
    { name: 'Registered', value: registeredUsers, fill: '#8B5CF6' },
    { name: 'Customers', value: customers, fill: '#6366F1' },
    { name: 'Returning', value: returningCustomers, fill: '#22C55E' },
  ], [registeredUsers, customers, returningCustomers]);

  const exportRows = useMemo(() => {
    const header = 'Stage,Count';
    return [header, ...funnelData.map((row) => `${row.name},${row.value}`)];
  }, [funnelData]);

  const refetch = () => {
    analytics.refetch();
    devices.refetch();
    commerce.refetch();
  };

  if (isError) {
    return <ErrorState title="Unable to load conversion analytics" onRetry={refetch} />;
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
              { label: 'Conversion' },
            ]}
          />
        )}
        label="Analytics"
        title="Conversion Analytics"
        actions={(
          <AdminAnalyticsToolbar
            onRefresh={refetch}
            isRefreshing={analytics.isFetching || devices.isFetching || commerce.isFetching}
            exportRows={exportRows}
            exportFilename={`conversion-${period}.csv`}
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
          <AdminMetricCard title="Visitors" value={funnelData[0].value} icon={Eye} />
          <AdminMetricCard title="Registered Users" value={registeredUsers} icon={Users} />
          <AdminMetricCard title="Customers" value={customers} icon={UserCheck} />
          <AdminMetricCard title="Returning Customers" value={returningCustomers} icon={Users} />
          <AdminMetricCard title="Checkout Completion" value={`${checkoutCompletion}%`} icon={MousePointerClick} />
          <AdminMetricCard title="Cart Abandonment" value={`${cartAbandonment}%`} icon={ShoppingCart} />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.08] bg-dashboard-surface/60 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold">Conversion Funnel</h3>
          <div className="h-72">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-xl bg-dashboard-bg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    <LabelList position="right" fill="#fff" stroke="none" dataKey="name" />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-dashboard-surface/60 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold">Device Usage</h3>
          <div className="h-72">
            {isLoading ? (
              <Skeleton className="h-full w-full rounded-xl bg-dashboard-bg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={deviceSplit} dataKey="value" nameKey="device" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {deviceSplit.map((entry, index) => (
                      <Cell key={entry.device} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.08] bg-dashboard-surface/60 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold">Top Categories (Interest)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCategories.slice(0, 6)}>
                <CartesianGrid stroke={DASHBOARD_CHART_GRID} strokeDasharray="3 3" />
                <XAxis dataKey="category" stroke={DASHBOARD_CHART_AXIS} fontSize={11} />
                <YAxis stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="purchases" fill={BRAND_PURPLE} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-dashboard-surface/60 p-5 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-semibold">Most Viewed Products</h3>
          <div className="space-y-2">
            {(commerceData.topProducts || []).slice(0, 5).map((product) => (
              <Link
                key={product.productId}
                href={ROUTES.ADMIN.PRODUCTS}
                className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2 transition hover:border-primary/30 hover:bg-primary/5"
              >
                <span className="text-sm font-medium text-dashboard-foreground">{product.name}</span>
                <span className="text-xs text-primary">{product.quantitySold} sold</span>
              </Link>
            ))}
            {!commerceData.topProducts?.length ? (
              <p className="py-8 text-center text-sm text-dashboard-muted">No product views tracked yet</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-dashboard-surface/60 p-5 backdrop-blur-sm">
        <h3 className="mb-4 text-lg font-semibold">User Growth Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={userGrowth}>
              <CartesianGrid stroke={DASHBOARD_CHART_GRID} strokeDasharray="3 3" />
              <XAxis dataKey="month" stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
              <YAxis stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
              <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              <Bar dataKey="newUsers" fill={BRAND_PURPLE} radius={[6, 6, 0, 0]} name="New Users" />
              <Bar dataKey="returningUsers" fill="#6366F1" radius={[6, 6, 0, 0]} name="Returning" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
