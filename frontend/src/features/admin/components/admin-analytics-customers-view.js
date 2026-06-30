'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  Search,
  UserRound,
} from 'lucide-react';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import {
  AdminMetricCard,
  AdminPageHeader,
} from '@/features/admin/components/admin-metric-card';
import { useAdminAnalyticsCustomersQuery, useAdminToken } from '@/features/admin/hooks';
import { fetchAdminAnalyticsCustomers } from '@/features/admin/services/admin.service';
import { buildMailtoLink, buildTelLink } from '@/features/admin/utils/analytics-contact.util';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/currency';
import { showToast } from '@/stores/toast-store';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function AdminAnalyticsCustomersView() {
  const queryClient = useQueryClient();
  const token = useAdminToken();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('highest_spend');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const params = useMemo(() => ({
    search: debouncedSearch || undefined,
    status: status || undefined,
    sort,
    page,
    limit: 20,
  }), [debouncedSearch, status, sort, page]);

  const { data, isLoading, isError, refetch } = useAdminAnalyticsCustomersQuery(params);

  const customers = data?.items || [];
  const summary = data?.summary || {};
  const meta = data?.meta || { page: 1, totalPages: 1, total: 0 };

  const allVisibleSelected = customers.length > 0
    && customers.every((customer) => selectedIds.includes(customer.id));

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter(
        (id) => !customers.some((customer) => customer.id === id),
      ));
      return;
    }

    setSelectedIds((current) => [
      ...new Set([...current, ...customers.map((customer) => customer.id)]),
    ]);
  };

  const toggleSelect = (id) => {
    setSelectedIds((current) => (
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id]
    ));
  };

  const selectedEmails = customers
    .filter((customer) => selectedIds.includes(customer.id))
    .map((customer) => customer.email)
    .filter(Boolean);

  const handleBulkEmail = (emails) => {
    const link = buildMailtoLink(emails);

    if (!link) {
      showToast('No email addresses available for the selected customers.', 'error');
      return;
    }

    window.location.href = link;
  };

  const handleEmailAllCustomers = async () => {
    if (!token) {
      return;
    }

    try {
      const response = await queryClient.fetchQuery({
        queryKey: ['admin-analytics-customers-bulk-email', debouncedSearch, status],
        queryFn: () => fetchAdminAnalyticsCustomers({
          search: debouncedSearch || undefined,
          status: status || undefined,
          sort,
          page: 1,
          limit: 100,
        }, token),
      });

      const emails = (response?.items || []).map((customer) => customer.email).filter(Boolean);

      if (response?.meta?.total > 100) {
        showToast('Opening mail for the first 100 customers matching your filters.', 'info');
      }

      handleBulkEmail(emails);
    } catch {
      showToast('Unable to prepare customer email list.', 'error');
    }
  };

  if (isLoading) {
    return <LoadingState title="Loading customer analytics…" rows={6} />;
  }

  if (isError) {
    return <ErrorState title="Unable to load customer analytics" onRetry={refetch} />;
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
        label="Analytics › Customers"
        title="Customer Analytics"
        action={(
          <p className="text-sm text-dashboard-muted">
            {meta.total} customers tracked
          </p>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <AdminMetricCard title="Total Customers" value={summary.totalCustomers ?? 0} icon={UserRound} />
        <AdminMetricCard title="Active Customers" value={summary.activeCustomers ?? 0} icon={UserRound} />
        <AdminMetricCard title="Returning Customers" value={summary.returningCustomers ?? 0} icon={UserRound} />
        <AdminMetricCard title="New This Month" value={summary.newCustomersThisMonth ?? 0} icon={UserRound} />
        <AdminMetricCard
          title="Total Revenue"
          value={summary.totalRevenueGenerated ?? 0}
          icon={UserRound}
          formatValue={formatCurrency}
        />
        <AdminMetricCard
          title="Avg Customer Spend"
          value={summary.averageCustomerSpend ?? 0}
          icon={UserRound}
          formatValue={formatCurrency}
        />
      </div>

      <div className="rounded-2xl border border-dashboard-border bg-dashboard-surface p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dashboard-muted" />
            <Input
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search by name, email, or phone…"
              className="h-10 border-dashboard-border bg-dashboard-bg pl-10"
            />
          </div>
          <select
            value={sort}
            onChange={(event) => { setSort(event.target.value); setPage(1); }}
            className="h-10 rounded-lg border border-dashboard-border bg-dashboard-bg px-3 text-sm text-dashboard-foreground"
          >
            <option value="highest_spend">Highest Spend</option>
            <option value="lowest_spend">Lowest Spend</option>
            <option value="most_orders">Most Orders</option>
            <option value="newest_customer">Newest Customer</option>
            <option value="oldest_customer">Oldest Customer</option>
          </select>
          <select
            value={status}
            onChange={(event) => { setStatus(event.target.value); setPage(1); }}
            className="h-10 rounded-lg border border-dashboard-border bg-dashboard-bg px-3 text-sm text-dashboard-foreground"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-dashboard-border/60 pt-4">
          {selectedIds.length ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <span className="text-sm font-medium text-dashboard-foreground">
                {selectedIds.length} selected
              </span>
              <Button
                size="sm"
                variant="ghost"
                className="text-dashboard-muted hover:text-dashboard-foreground"
                onClick={() => setSelectedIds([])}
              >
                Clear
              </Button>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-dashboard-muted">
              Bulk email
            </span>
            <Button
              size="sm"
              variant="glass"
              onClick={() => handleBulkEmail(selectedEmails)}
              disabled={!selectedIds.length}
            >
              <Mail className="size-4" />
              Email Selected
            </Button>
            <Button
              size="sm"
              variant="glass"
              onClick={() => handleBulkEmail(customers.map((customer) => customer.email))}
            >
              <Mail className="size-4" />
              Email All on Page
            </Button>
            <Button
              size="sm"
              variant="glass"
              onClick={handleEmailAllCustomers}
            >
              <Mail className="size-4" />
              Email All Customers
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="sticky top-0 z-10 bg-dashboard-surface">
              <tr className="border-b border-dashboard-border text-left text-xs uppercase tracking-wider text-dashboard-muted">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all customers on this page"
                  />
                </th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Lifetime Spend</th>
                <th className="px-4 py-3">AOV</th>
                <th className="px-4 py-3">Last Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length ? customers.map((customer) => {
                const telLink = buildTelLink(customer.phone);
                const mailLink = buildMailtoLink([customer.email]);

                return (
                  <tr
                    key={customer.id}
                    className="border-b border-dashboard-border/60 transition-colors last:border-0 hover:bg-dashboard-bg/40"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(customer.id)}
                        onChange={() => toggleSelect(customer.id)}
                        aria-label={`Select ${customer.name}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                          {customer.avatarInitial}
                        </span>
                        <span className="font-medium text-dashboard-foreground">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-dashboard-muted">{customer.email}</td>
                    <td className="px-4 py-3 text-dashboard-muted">{customer.phone || '—'}</td>
                    <td className="px-4 py-3">{customer.orderCount}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(customer.lifetimeSpend)}</td>
                    <td className="px-4 py-3">{formatCurrency(customer.averageOrderValue)}</td>
                    <td className="px-4 py-3 text-dashboard-muted">{formatDate(customer.lastOrderDate)}</td>
                    <td className="px-4 py-3">
                      <Badge className={cn(
                        customer.status === 'active' && 'bg-emerald-500/15 text-emerald-400',
                        customer.status !== 'active' && 'bg-red-500/15 text-red-400',
                      )}
                      >
                        {customer.status === 'active' ? 'Active' : 'Blocked'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-dashboard-muted">{formatDate(customer.registrationDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button asChild size="sm" variant="glass" className="h-8 px-3">
                          <Link href={ROUTES.ADMIN.USERS}>View</Link>
                        </Button>
                        {telLink ? (
                          <Button
                            asChild
                            size="icon"
                            variant="glass"
                            className="size-8"
                            aria-label={`Call ${customer.name}`}
                          >
                            <a href={telLink}><Phone className="size-4" /></a>
                          </Button>
                        ) : null}
                        {mailLink ? (
                          <Button
                            asChild
                            size="icon"
                            variant="glass"
                            className="size-8"
                            aria-label={`Email ${customer.name}`}
                          >
                            <a href={mailLink}><Mail className="size-4" /></a>
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center text-dashboard-muted">
                    No customers match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-dashboard-muted">
        <span>{meta.total} customers</span>
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
