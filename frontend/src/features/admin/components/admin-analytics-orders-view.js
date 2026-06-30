'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, IndianRupee, Package, RotateCcw, ShoppingBag } from 'lucide-react';
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
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { AdminMetricCard, AdminPageHeader } from '@/features/admin/components/admin-metric-card';
import { useAdminAnalyticsOrdersDetailQuery } from '@/features/admin/hooks';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/currency';
import { CHART_TOOLTIP_STYLE } from '@/constants/charts';
import { BRAND_PURPLE, DASHBOARD_CHART_AXIS, DASHBOARD_CHART_GRID } from '@/constants/colors';

export function AdminAnalyticsOrdersView() {
  const [status, setStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');

  const params = useMemo(() => ({
    status: status || undefined,
    paymentMethod: paymentMethod || undefined,
  }), [status, paymentMethod]);

  const { data, isLoading, isError, refetch } = useAdminAnalyticsOrdersDetailQuery(params);
  const summary = data?.summary || {};
  const ordersPerMonth = data?.ordersPerMonth || [];
  const revenueTrend = data?.revenueTrend || [];
  const statusDistribution = data?.statusDistribution || [];

  if (isLoading) {
    return <LoadingState title="Loading order analytics…" rows={4} />;
  }

  if (isError) {
    return <ErrorState title="Unable to load order analytics" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="glass" size="sm">
        <Link href={ROUTES.ADMIN.ANALYTICS}>
          <ArrowLeft className="mr-2 size-4" />
          Back to Analytics
        </Link>
      </Button>

      <AdminPageHeader label="Analytics" title="Order Analytics" />

      <div className="sticky top-20 z-20 rounded-2xl border border-dashboard-border bg-dashboard-surface/95 p-4 backdrop-blur">
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminMetricCard title="Total Orders" value={summary.totalOrders ?? 0} icon={ShoppingBag} />
        <AdminMetricCard title="Delivered" value={summary.delivered ?? 0} icon={Package} />
        <AdminMetricCard title="Cancelled" value={summary.cancelled ?? 0} icon={RotateCcw} />
        <AdminMetricCard title="Returned" value={summary.returned ?? 0} icon={RotateCcw} />
        <AdminMetricCard
          title="Revenue"
          value={summary.revenue ?? 0}
          icon={IndianRupee}
          formatValue={formatCurrency}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-5">
          <h3 className="mb-4 text-lg font-semibold">Orders Trend</h3>
          <div className="h-72">
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
          </div>
        </div>

        <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-5">
          <h3 className="mb-4 text-lg font-semibold">Revenue Trend</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrend}>
                <CartesianGrid stroke={DASHBOARD_CHART_GRID} strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <YAxis stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="revenue" stroke={BRAND_PURPLE} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-5">
        <h3 className="mb-4 text-lg font-semibold">Order Status Distribution</h3>
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
    </div>
  );
}
