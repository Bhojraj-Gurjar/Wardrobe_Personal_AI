'use client';

import Link from 'next/link';
import { ArrowLeft, Laptop, MonitorSmartphone, Smartphone } from 'lucide-react';
import {
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
import { AdminMetricCard, AdminPageHeader } from '@/features/admin/components/admin-metric-card';
import { useAdminAnalyticsDevicesQuery } from '@/features/admin/hooks';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { CHART_COLORS, CHART_TOOLTIP_STYLE } from '@/constants/charts';
import { BRAND_PURPLE, DASHBOARD_CHART_AXIS, DASHBOARD_CHART_GRID } from '@/constants/colors';

export function AdminAnalyticsDevicesView() {
  const { data, isLoading, isError, refetch } = useAdminAnalyticsDevicesQuery();
  const summary = data?.summary || {};
  const deviceSplit = data?.deviceSplit || [];
  const browserDistribution = data?.browserDistribution || [];
  const osDistribution = data?.osDistribution || [];
  const rows = data?.rows || [];

  if (isLoading) {
    return <LoadingState title="Loading device analytics…" rows={4} />;
  }

  if (isError) {
    return <ErrorState title="Unable to load device analytics" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="glass" size="sm">
        <Link href={ROUTES.ADMIN.ANALYTICS}>
          <ArrowLeft className="mr-2 size-4" />
          Back to Analytics
        </Link>
      </Button>

      <AdminPageHeader label="Analytics" title="Device Analytics" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard title="Total Sessions" value={summary.totalSessions ?? 0} icon={MonitorSmartphone} />
        <AdminMetricCard title="Tracked Devices" value={summary.trackedDevices ?? 0} icon={Laptop} />
        <AdminMetricCard title="Mobile Share" value={`${summary.mobileShare ?? 0}%`} icon={Smartphone} />
        <AdminMetricCard title="Desktop Share" value={`${summary.desktopShare ?? 0}%`} icon={Laptop} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-5">
          <h3 className="mb-4 text-lg font-semibold">Device Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deviceSplit} dataKey="percentage" nameKey="device" innerRadius={50} outerRadius={80}>
                  {deviceSplit.map((entry, index) => (
                    <Cell key={entry.device} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-5">
          <h3 className="mb-4 text-lg font-semibold">Browser Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={browserDistribution}>
                <CartesianGrid stroke={DASHBOARD_CHART_GRID} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <YAxis stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="value" fill={BRAND_PURPLE} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-5">
          <h3 className="mb-4 text-lg font-semibold">OS Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={osDistribution}>
                <CartesianGrid stroke={DASHBOARD_CHART_GRID} strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <YAxis stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="value" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-surface">
        <table className="min-w-full text-sm">
          <thead className="bg-dashboard-bg/40 text-left text-dashboard-muted">
            <tr>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Browser</th>
              <th className="px-4 py-3">OS</th>
              <th className="px-4 py-3">Sessions</th>
              <th className="px-4 py-3">Bounce Rate</th>
              <th className="px-4 py-3">Avg Duration</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${row.device}-${row.browser}-${index}`} className="border-t border-dashboard-border/60">
                <td className="px-4 py-3">{row.device}</td>
                <td className="px-4 py-3">{row.browser}</td>
                <td className="px-4 py-3">{row.os}</td>
                <td className="px-4 py-3">{row.sessions}</td>
                <td className="px-4 py-3">{row.bounceRate}%</td>
                <td className="px-4 py-3">{row.avgSessionDuration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
