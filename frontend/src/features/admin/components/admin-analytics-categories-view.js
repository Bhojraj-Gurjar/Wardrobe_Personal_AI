'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Heart, Layers, ShoppingCart, Tag } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { AdminMetricCard, AdminPageHeader } from '@/features/admin/components/admin-metric-card';
import { useAdminAnalyticsCategoriesQuery } from '@/features/admin/hooks';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/utils/currency';
import { CHART_TOOLTIP_STYLE } from '@/constants/charts';
import { BRAND_PURPLE, DASHBOARD_CHART_AXIS, DASHBOARD_CHART_GRID } from '@/constants/colors';

export function AdminAnalyticsCategoriesView() {
  const [category, setCategory] = useState('');
  const params = useMemo(() => ({ category: category || undefined }), [category]);

  const { data, isLoading, isError, refetch } = useAdminAnalyticsCategoriesQuery(params);
  const summary = data?.summary || {};
  const items = data?.items || [];
  const revenueByCategory = data?.revenueByCategory || [];
  const purchasesByCategory = data?.purchasesByCategory || [];
  const wishlistByCategory = data?.wishlistByCategory || [];

  if (isLoading) {
    return <LoadingState title="Loading category analytics…" rows={4} />;
  }

  if (isError) {
    return <ErrorState title="Unable to load category analytics" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="glass" size="sm">
        <Link href={ROUTES.ADMIN.ANALYTICS}>
          <ArrowLeft className="mr-2 size-4" />
          Back to Analytics
        </Link>
      </Button>

      <AdminPageHeader label="Analytics" title="Category Analytics" />

      <div className="sticky top-20 z-20 rounded-2xl border border-dashboard-border bg-dashboard-surface/95 p-4 backdrop-blur">
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="h-10 w-full max-w-sm rounded-xl border border-dashboard-border bg-dashboard-bg px-3 text-sm"
        >
          <option value="">All categories</option>
          {items.map((item) => (
            <option key={item.category} value={item.category}>{item.category}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard title="Categories" value={summary.totalCategories ?? 0} icon={Tag} />
        <AdminMetricCard title="Top Category" value={summary.topCategory ?? '—'} icon={Layers} />
        <AdminMetricCard
          title="Total Revenue"
          value={summary.totalRevenue ?? 0}
          icon={ShoppingCart}
          formatValue={formatCurrency}
        />
        <AdminMetricCard title="Total Purchases" value={summary.totalPurchases ?? 0} icon={Heart} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-5">
          <h3 className="mb-4 text-lg font-semibold">Revenue by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByCategory}>
                <CartesianGrid stroke={DASHBOARD_CHART_GRID} strokeDasharray="3 3" />
                <XAxis dataKey="category" stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <YAxis stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="revenue" fill={BRAND_PURPLE} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-5">
          <h3 className="mb-4 text-lg font-semibold">Purchases by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={purchasesByCategory}>
                <CartesianGrid stroke={DASHBOARD_CHART_GRID} strokeDasharray="3 3" />
                <XAxis dataKey="category" stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <YAxis stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="purchases" fill="#6366F1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-5">
          <h3 className="mb-4 text-lg font-semibold">Wishlist by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wishlistByCategory}>
                <CartesianGrid stroke={DASHBOARD_CHART_GRID} strokeDasharray="3 3" />
                <XAxis dataKey="category" stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <YAxis stroke={DASHBOARD_CHART_AXIS} fontSize={12} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                <Bar dataKey="wishlistCount" fill="#ec4899" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-dashboard-border bg-dashboard-surface">
        <table className="min-w-full text-sm">
          <thead className="bg-dashboard-bg/40 text-left text-dashboard-muted">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Revenue</th>
              <th className="px-4 py-3">Purchases</th>
              <th className="px-4 py-3">Wishlist</th>
              <th className="px-4 py-3">Cart</th>
              <th className="px-4 py-3">Returns</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.category} className="border-t border-dashboard-border/60">
                <td className="px-4 py-3 font-medium text-dashboard-foreground">{item.category}</td>
                <td className="px-4 py-3">{item.products}</td>
                <td className="px-4 py-3">{formatCurrency(item.revenue)}</td>
                <td className="px-4 py-3">{item.purchases}</td>
                <td className="px-4 py-3">{item.wishlistCount}</td>
                <td className="px-4 py-3">{item.cartCount}</td>
                <td className="px-4 py-3">{item.returns}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
