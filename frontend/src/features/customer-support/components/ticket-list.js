'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/select';
import { ROUTES } from '@/constants/routes';
import { useSupportTicketsQuery } from '../hooks/use-support-tickets';
import {
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  SUPPORT_STATUSES,
} from '../utils/support.constants';
import { formatSupportDate, getTicketLastMessagePreview } from '../utils/support.utils';
import { StatusBadge } from './status-badge';
import { PriorityBadge } from './priority-badge';
import { TicketCreatedBanner } from './new-ticket-form';

function TicketListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createdTicket = searchParams.get('created');

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: '',
    category: '',
    priority: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
  });

  const queryParams = useMemo(() => filters, [filters]);
  const { data, isLoading, isError, refetch } = useSupportTicketsQuery(queryParams);

  const tickets = data?.items || [];

  function openTicket(ticketId) {
    router.push(ROUTES.SUPPORT.TICKET(ticketId));
  }

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  }

  if (isLoading) return <LoadingState message="Loading your tickets..." />;
  if (isError) return <ErrorState message="Failed to load tickets" onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <TicketCreatedBanner ticketNumber={createdTicket} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-dashboard-foreground">My Tickets</h1>
          <p className="text-sm text-dashboard-muted">Track and manage your support requests</p>
        </div>
        <Link
          href={ROUTES.SUPPORT.NEW}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-500 to-purple-700 px-6 text-sm font-semibold text-white"
        >
          Create New Ticket
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative xl:col-span-2">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dashboard-muted" />
          <Input
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Search tickets..."
            className="pl-10"
          />
        </div>
        <SelectField value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
          <option value="">All statuses</option>
          {SUPPORT_STATUSES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </SelectField>
        <SelectField value={filters.category} onChange={(event) => updateFilter('category', event.target.value)}>
          <option value="">All categories</option>
          {SUPPORT_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </SelectField>
        <SelectField value={filters.priority} onChange={(event) => updateFilter('priority', event.target.value)}>
          <option value="">All priorities</option>
          {SUPPORT_PRIORITIES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </SelectField>
      </div>

      {tickets.length ? (
        <div className="overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-dashboard-border/60 text-xs uppercase tracking-wider text-dashboard-muted">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Last Message</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Unread</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => {
                const preview = getTicketLastMessagePreview(ticket);

                return (
                  <tr
                    key={ticket.id}
                    role="link"
                    tabIndex={0}
                    className="cursor-pointer border-b border-dashboard-border/60 last:border-0 hover:bg-dashboard-surface-elevated/40"
                    onClick={() => openTicket(ticket.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openTicket(ticket.id);
                      }
                    }}
                  >
                    <td className="px-4 py-4">
                      <p className="font-medium text-dashboard-foreground">{ticket.subject}</p>
                      <p className="text-xs text-dashboard-muted">{ticket.ticketNumber}</p>
                    </td>
                    <td className="max-w-xs px-4 py-4 text-dashboard-muted">
                      <p className="line-clamp-2 text-sm">
                        {preview || '—'}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-dashboard-muted">
                      {SUPPORT_CATEGORIES.find((item) => item.value === ticket.category)?.label}
                    </td>
                    <td className="px-4 py-4"><PriorityBadge priority={ticket.priority} /></td>
                    <td className="px-4 py-4"><StatusBadge status={ticket.status} /></td>
                    <td className="px-4 py-4 text-dashboard-muted">{formatSupportDate(ticket.updatedAt)}</td>
                    <td className="px-4 py-4">
                      {ticket.unreadCount > 0 ? (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-white">
                          {ticket.unreadCount}
                        </span>
                      ) : (
                        <span className="text-dashboard-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No tickets found"
          description="Try adjusting your filters or create a new support ticket."
          actionLabel="Create New Ticket"
          onAction={() => { window.location.href = ROUTES.SUPPORT.NEW; }}
        />
      )}
    </div>
  );
}

export function TicketListView() {
  return (
    <Suspense fallback={<LoadingState message="Loading support tickets..." />}>
      <TicketListContent />
    </Suspense>
  );
}
