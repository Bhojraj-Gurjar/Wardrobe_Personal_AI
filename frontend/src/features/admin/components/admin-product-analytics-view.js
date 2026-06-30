'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Package,
  Search,
  ShoppingBag,
  Star,
  TrendingUp,
} from 'lucide-react';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import {
  AdminMetricCard,
  AdminPageHeader,
} from '@/features/admin/components/admin-metric-card';
import { useAdminAnalyticsProductsQuery } from '@/features/admin/hooks';
import { CMS_CATEGORIES } from '@/features/admin/products/constants/cms-taxonomy';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/currency';

function StatBadge({ label, value, tone = 'default' }) {
  const tones = {
    default: 'bg-dashboard-bg text-dashboard-muted border-dashboard-border',
    purchase: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    wishlist: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    cart: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    return: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium',
      tones[tone],
    )}
    >
      <span className="opacity-70">{label}</span>
      {value}
    </span>
  );
}

export function AdminProductAnalyticsView() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState('');
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('purchase_count');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const params = useMemo(() => ({
    search: debouncedSearch || undefined,
    category: category || undefined,
    filter: filter || undefined,
    sort,
    page,
    limit: 20,
  }), [debouncedSearch, category, filter, sort, page]);

  const { data, isLoading, isError, refetch } = useAdminAnalyticsProductsQuery(params);

  const products = data?.items || [];
  const summary = data?.summary || {};
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };

  if (isLoading) {
    return <LoadingState title="Loading product analytics…" rows={6} />;
  }

  if (isError) {
    return <ErrorState title="Unable to load product analytics" onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={ROUTES.ADMIN.ANALYTICS}
          className="inline-flex items-center gap-2 text-sm text-dashboard-muted transition-colors hover:text-dashboard-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Analytics
        </Link>
      </div>

      <AdminPageHeader
        label="Analytics › Product Analytics"
        title="Product Analytics"
        action={(
          <p className="text-sm text-dashboard-muted">
            {meta.total} products tracked
          </p>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <AdminMetricCard
          title="Best Selling"
          value={summary.bestSellingProduct || '—'}
          icon={ShoppingBag}
        />
        <AdminMetricCard
          title="Total Units Sold"
          value={summary.totalUnitsSold ?? 0}
          icon={Package}
        />
        <AdminMetricCard
          title="Total Revenue"
          value={summary.totalRevenue ?? 0}
          icon={TrendingUp}
          formatValue={formatCurrency}
        />
        <AdminMetricCard
          title="Total Returns"
          value={summary.totalReturns ?? 0}
          icon={Package}
        />
        <AdminMetricCard
          title="Most Wishlisted"
          value={summary.mostWishlistedProduct || '—'}
          icon={Star}
        />
        <AdminMetricCard
          title="Most Added To Cart"
          value={summary.mostAddedToCartProduct || '—'}
          icon={ShoppingBag}
        />
      </div>

      <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dashboard-muted" />
            <Input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search by product name, SKU, or category…"
              className="h-10 border-dashboard-border bg-dashboard-bg pl-10"
            />
          </div>
          <select
            value={category}
            onChange={(event) => { setCategory(event.target.value); setPage(1); }}
            className="h-10 rounded-lg border border-dashboard-border bg-dashboard-bg px-3 text-sm"
          >
            <option value="">All categories</option>
            {CMS_CATEGORIES.map((entry) => (
              <option key={entry} value={entry}>{entry}</option>
            ))}
          </select>
          <select
            value={filter}
            onChange={(event) => { setFilter(event.target.value); setPage(1); }}
            className="h-10 rounded-lg border border-dashboard-border bg-dashboard-bg px-3 text-sm"
          >
            <option value="">All products</option>
            <option value="best_selling">Best Selling</option>
            <option value="most_wishlisted">Most Wishlisted</option>
            <option value="highest_revenue">Highest Revenue</option>
            <option value="highest_returns">Highest Returns</option>
            <option value="highest_rating">Highest Rating</option>
            <option value="lowest_stock">Lowest Stock</option>
          </select>
          <select
            value={sort}
            onChange={(event) => { setSort(event.target.value); setPage(1); }}
            className="h-10 rounded-lg border border-dashboard-border bg-dashboard-bg px-3 text-sm"
          >
            <option value="purchase_count">Purchase Count</option>
            <option value="wishlist_count">Wishlist Count</option>
            <option value="cart_count">Cart Count</option>
            <option value="revenue">Revenue</option>
            <option value="returns">Returns</option>
            <option value="rating">Rating</option>
            <option value="stock">Stock (Low to High)</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px] text-sm">
            <thead className="sticky top-0 z-10 bg-dashboard-surface">
              <tr className="border-b border-dashboard-border text-left text-xs uppercase tracking-wider text-dashboard-muted">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Insights</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.length ? products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-dashboard-border/60 transition-colors last:border-0 hover:bg-dashboard-bg/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="size-11 shrink-0 overflow-hidden rounded-lg border border-dashboard-border bg-dashboard-bg">
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.imageUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <span className="flex size-full items-center justify-center text-xs text-dashboard-muted">—</span>
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-dashboard-foreground">{product.name}</p>
                        <p className="truncate text-xs text-dashboard-muted">{product.sku || product.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-dashboard-muted">{product.category || '—'}</td>
                  <td className="px-4 py-3 text-dashboard-muted">{product.productType || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <StatBadge label="Purchased" value={product.purchaseCount} tone="purchase" />
                      <StatBadge label="Wishlist" value={product.wishlistCount} tone="wishlist" />
                      <StatBadge label="Cart" value={product.cartCount} tone="cart" />
                      <StatBadge label="Returned" value={product.returnCount} tone="return" />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(product.revenueGenerated)}</td>
                  <td className="px-4 py-3">
                    {product.rating != null ? (
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        {Number(product.rating).toFixed(1)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      product.stock <= 0 && 'text-red-400',
                      product.stock > 0 && product.stock <= 10 && 'text-amber-400',
                    )}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn(
                      product.publishedStatus === 'Published' && 'bg-emerald-500/15 text-emerald-400',
                      product.publishedStatus === 'Draft' && 'bg-amber-500/15 text-amber-400',
                      product.publishedStatus !== 'Published' && product.publishedStatus !== 'Draft' && 'bg-dashboard-bg text-dashboard-muted',
                    )}
                    >
                      {product.publishedStatus || '—'}
                    </Badge>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-dashboard-muted">
                    No products match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-dashboard-muted">
        <span>{meta.total} products</span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="glass" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span>Page {meta.page} of {meta.totalPages}</span>
          <Button
            size="sm"
            variant="glass"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
