'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, UserPlus, Users } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { AdminMetricCard, AdminPageHeader } from '@/features/admin/components/admin-metric-card';
import { useAdminAnalyticsUserGrowthQuery } from '@/features/admin/hooks';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { CHART_TOOLTIP_STYLE } from '@/constants/charts';
import { BRAND_PURPLE, DASHBOARD_CHART_AXIS, DASHBOARD_CHART_GRID } from '@/constants/colors';

const PERIODS = ['weekly', 'monthly', 'quarterly', 'yearly'];

export function AdminAnalyticsUserGrowthView() {
  const [period, setPeriod] = useState('monthly');
  const [status, setStatus] = useState('');
  const [plan, setPlan] = useState('');
  const [source, setSource] = useState('');

  const params = useMemo(() => ({
    period,
    status: status || undefined,
    plan: plan || undefined,
    source: source || undefined,
  }), [period, status, plan, source]);

  const { data, isLoading, isError, refetch } = useAdminAnalyticsUserGrowthQuery(params);
  const summary = data?.summary || {};
  const chartData = data?.series?.[period] || data?.series?.monthly || [];

  if (isLoading) {
    return <LoadingState title="Loading user growth analytics…" rows={4} />;
  }

  if (isError) {
    return <ErrorState title="Unable to load user growth analytics" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="glass" size="sm">
          <Link href={ROUTES.ADMIN.ANALYTICS}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Analytics
          </Link>
        </Button>
      </div>

      <AdminPageHeader label="Analytics" title="User Growth" />

      <div className="sticky top-20 z-20 rounded-2xl border border-dashboard-border bg-dashboard-surface/95 p-4 backdrop-blur">
        <div className="grid gap-3 md:grid-cols-4">
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="h-10 rounded-xl border border-dashboard-border bg-dashboard-bg px-3 text-sm"
          >
            {PERIODS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-xl border border-dashboard-border bg-dashboard-bg px-3 text-sm"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={plan}
            onChange={(event) => setPlan(event.target.value)}
            className="h-10 rounded-xl border border-dashboard-border bg-dashboard-bg px-3 text-sm"
          >
            <option value="">All plans</option>
            <option value="premium">Premium</option>
            <option value="free">Free</option>
          </select>
          <select
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className="h-10 rounded-xl border border-dashboard-border bg-dashboard-bg px-3 text-sm"
          >
            <option value="">All sources</option>
            <option value="email">Email</option>
            <option value="face">Face Login</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminMetricCard title="Total Users" value={summary.totalUsers ?? 0} icon={Users} />
        <AdminMetricCard title="New Users" value={summary.newUsers ?? 0} icon={UserPlus} />
        <AdminMetricCard title="Returning Users" value={summary.returningUsers ?? 0} icon={Users} />
        <AdminMetricCard title="Active Users" value={summary.activeUsers ?? 0} icon={Users} />
        <AdminMetricCard title="Growth %" value={`${summary.growthPercent ?? 0}%`} icon={TrendingUp} />
      </div>

      <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-5">
        <h3 className="mb-4 text-lg font-semibold text-dashboard-foreground">Growth Trend</h3>
        <div className="h-80">
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
        </div>
      </div>
    </div>
  );
}
