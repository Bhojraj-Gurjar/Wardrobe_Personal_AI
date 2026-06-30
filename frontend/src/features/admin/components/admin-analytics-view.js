'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';import {
  Clock,
  Eye,
  IndianRupee,
  Layers,
  ShoppingBag,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
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
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import {
  AdminMetricCard,
  AdminPageHeader,
} from '@/features/admin/components/admin-metric-card';
import { AdminAnalyticsChartCard } from '@/features/admin/components/admin-analytics-chart-card';
import { useAdminAnalyticsQuery, useAdminOrdersAnalyticsQuery } from '@/features/admin/hooks';
import { formatCurrency } from '@/utils/currency';

import { CHART_COLORS, CHART_TOOLTIP_STYLE } from '@/constants/charts';
import { BRAND_PURPLE, DASHBOARD_CHART_AXIS, DASHBOARD_CHART_GRID } from '@/constants/colors';

const GROWTH_PERIODS = [
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'yearly', label: 'Yearly' },
];

function GrowthTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload || {};

  return (
    <div className="rounded-xl border border-dashboard-border bg-dashboard-surface px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-dashboard-foreground">{label}</p>
      <p className="text-dashboard-muted">New Users: {point.newUsers ?? 0}</p>
      <p className="text-dashboard-muted">Returning Users: {point.returningUsers ?? 0}</p>
      <p className="text-dashboard-muted">Total Users: {point.totalUsers ?? 0}</p>
      <p className="text-dashboard-muted">Growth: {point.growthPercent ?? 0}%</p>
    </div>
  );
}

function OrdersTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload || {};

  return (
    <div className="rounded-xl border border-dashboard-border bg-dashboard-surface px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-dashboard-foreground">{label}</p>
      <p className="text-dashboard-muted">Orders: {point.orders ?? 0}</p>
      <p className="text-dashboard-muted">Completed: {point.completed ?? 0}</p>
      <p className="text-dashboard-muted">Revenue: ₹{point.revenue ?? 0}</p>
    </div>
  );
}

function CategoryTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload || {};

  return (
    <div className="rounded-xl border border-dashboard-border bg-dashboard-surface px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-dashboard-foreground">{point.category}</p>
      <p className="text-dashboard-muted">Revenue: ₹{point.revenue ?? 0}</p>
      <p className="text-dashboard-muted">Orders: {point.purchases ?? point.count ?? 0}</p>
      <p className="text-dashboard-muted">Products: {point.products ?? 0}</p>
    </div>
  );
}

export function AdminAnalyticsView() {
  const [growthPeriod, setGrowthPeriod] = useState('monthly');
  const { data, isLoading, isError, refetch } = useAdminAnalyticsQuery({ period: growthPeriod });
  const commerceQuery = useAdminOrdersAnalyticsQuery();
  const monthLabel = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const ordersPerMonth = data?.ordersPerMonth || [];

  const ordersChartData = useMemo(
    () => ordersPerMonth.map((item) => ({
      ...item,
      orders: item.orders ?? 0,
    })),
    [ordersPerMonth],
  );

  if (isLoading) {
    return <LoadingState title="Loading analytics…" rows={4} />;
  }

  if (isError) {
    return <ErrorState title="Unable to load analytics" onRetry={refetch} />;
  }

  const cards = data?.cards || {};
  const commerce = commerceQuery.data || {};
  const userGrowth = data?.userGrowth || data?.userGrowthChart || [];
  const deviceSplit = data?.deviceSplit || [];
  const topCategories = data?.topCategories || [];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        label="Analytics"
        title="Analytics"
        action={
          <p className="text-sm text-dashboard-muted">Platform insights · {monthLabel}</p>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          title="Avg Session Duration"
          value={cards.avgSessionDuration?.value ?? '—'}
          trend={cards.avgSessionDuration?.trend}
          icon={Clock}
        />
        <AdminMetricCard
          title="Bounce Rate"
          value={cards.bounceRate?.value ?? '—'}
          trend={cards.bounceRate?.trend}
          icon={Eye}
        />
        <AdminMetricCard
          title="Pages per Session"
          value={cards.pagesPerSession?.value ?? '—'}
          trend={cards.pagesPerSession?.trend}
          icon={Layers}
        />
        <AdminMetricCard
          title="AI Feature Adoption"
          value={cards.aiFeatureAdoption?.value ?? '—'}
          trend={cards.aiFeatureAdoption?.trend}
          icon={Sparkles}
        />
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-dashboard-foreground">Commerce Analytics</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminMetricCard
            title="Daily Revenue"
            value={commerce.dailyRevenue ?? 0}
            icon={IndianRupee}
            formatValue={formatCurrency}
          />
          <AdminMetricCard
            title="Monthly Revenue"
            value={commerce.monthlyRevenue ?? 0}
            icon={TrendingUp}
            formatValue={formatCurrency}
          />
          <AdminMetricCard
            title="Average Order Value"
            value={Math.round(commerce.averageOrderValue ?? 0)}
            icon={ShoppingBag}
            formatValue={formatCurrency}
          />
          <AdminMetricCard
            title="Total Orders"
            value={commerce.totalOrders ?? 0}
            icon={Layers}
          />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="interactive-card rounded-2xl border border-dashboard-border bg-dashboard-surface p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-dashboard-foreground">Top Customers</h3>
              <p className="text-sm text-dashboard-muted">By lifetime spend</p>
            </div>
            <Button asChild size="sm" variant="glass">
              <Link href={ROUTES.ADMIN.ANALYTICS_CUSTOMERS}>View All</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {(commerce.topCustomers || []).map((customer, index) => (
              <div
                key={customer.userId}
                className="flex items-center justify-between rounded-xl border border-dashboard-border/60 bg-dashboard-bg/30 px-4 py-3 transition-colors hover:bg-dashboard-bg/50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-dashboard-foreground">{customer.name}</p>
                    <p className="text-xs text-dashboard-muted">{customer.orderCount} orders</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-dashboard-foreground">
                  {formatCurrency(customer.totalSpent)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="interactive-card rounded-2xl border border-dashboard-border bg-dashboard-surface p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-dashboard-foreground">Most Purchased Products</h3>
              <p className="text-sm text-dashboard-muted">By units sold</p>
            </div>
            <Button asChild size="sm" variant="glass">
              <Link href={ROUTES.ADMIN.ANALYTICS_PRODUCTS}>View All</Link>
            </Button>
          </div>
          <div className="space-y-3">
            {(commerce.topProducts || []).map((product, index) => (
              <div
                key={product.productId}
                className="flex items-center justify-between rounded-xl border border-dashboard-border/60 bg-dashboard-bg/30 px-4 py-3 transition-colors hover:bg-dashboard-bg/50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-dashboard-foreground">
                      {product.name}
                    </p>
                    <p className="text-xs text-primary">{product.brand}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-dashboard-foreground">
                  {product.quantitySold} sold
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AdminAnalyticsChartCard
          title="User Growth"
          description="New vs returning users over time"
          href={ROUTES.ADMIN.ANALYTICS_USER_GROWTH}
          isLoading={isLoading}
          isEmpty={!userGrowth.length}
          footer={(
            <div className="flex flex-wrap gap-2">
              {GROWTH_PERIODS.map((period) => (
                <button
                  key={period.id}
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setGrowthPeriod(period.id);
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    growthPeriod === period.id
                      ? 'bg-primary/15 text-primary'
                      : 'bg-dashboard-bg/40 text-dashboard-muted hover:text-dashboard-foreground'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          )}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowth}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRAND_PURPLE} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={BRAND_PURPLE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={DASHBOARD_CHART_GRID} strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <YAxis stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <Tooltip content={<GrowthTooltip />} />
                <Area
                  type="monotone"
                  dataKey="newUsers"
                  stroke={BRAND_PURPLE}
                  fill="url(#growthGrad)"
                  strokeWidth={2}
                  name="New Users"
                />
                <Area
                  type="monotone"
                  dataKey="returningUsers"
                  stroke="#6366F1"
                  fill="#6366F133"
                  strokeWidth={2}
                  name="Returning Users"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AdminAnalyticsChartCard>

        <AdminAnalyticsChartCard
          title="Device Split"
          description="Desktop, mobile, tablet, and unknown usage"
          href={ROUTES.ADMIN.ANALYTICS_DEVICES}
          isLoading={isLoading}
          isEmpty={!deviceSplit.length}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deviceSplit}
                  dataKey="percentage"
                  nameKey="device"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {deviceSplit.map((entry, index) => (
                    <Cell key={entry.device} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={CHART_TOOLTIP_STYLE}
                  formatter={(value, _name, item) => [
                    `${value}% (${item?.payload?.users ?? item?.payload?.count ?? 0} users)`,
                    item?.payload?.device,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1">
            {deviceSplit.map((item, index) => (
              <div key={item.device} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-dashboard-muted">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  {item.device}
                </span>
                <span className="text-dashboard-foreground">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </AdminAnalyticsChartCard>

        <AdminAnalyticsChartCard
          title="Orders Per Month"
          description="Monthly order volume and revenue"
          href={ROUTES.ADMIN.ANALYTICS_ORDERS}
          isLoading={isLoading}
          isEmpty={!ordersChartData.length}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersChartData}>
                <CartesianGrid stroke={DASHBOARD_CHART_GRID} strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <YAxis stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <Tooltip content={<OrdersTooltip />} />
                <Bar dataKey="orders" fill={BRAND_PURPLE} radius={[6, 6, 0, 0]} />
                <Bar dataKey="completed" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminAnalyticsChartCard>

        <AdminAnalyticsChartCard
          title="Top Categories"
          description="Best-performing product categories"
          href={ROUTES.ADMIN.ANALYTICS_CATEGORIES}
          isLoading={isLoading}
          isEmpty={!topCategories.length}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCategories} layout="vertical">
                <CartesianGrid stroke={DASHBOARD_CHART_GRID} strokeDasharray="3 3" />
                <XAxis type="number" stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <YAxis dataKey="category" type="category" stroke={DASHBOARD_CHART_AXIS} fontSize={12} width={90} />
                <Tooltip content={<CategoryTooltip />} />
                <Bar dataKey="revenue" fill="#6366F1" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </AdminAnalyticsChartCard>
      </div>
    </div>
  );
}
