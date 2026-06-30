'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Download,
  Headphones,
  Search,
  Ticket,
  Trash2,
  X,
} from 'lucide-react';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import {
  AdminMetricCard,
  AdminPageHeader,
} from '@/features/admin/components/admin-metric-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/select';
import { cn } from '@/utils/cn';
import {
  useAdminDeleteSupportTicketMutation,
  useAdminExportSupportTicketsMutation,
  useAdminReplySupportTicketMutation,
  useAdminSupportAnalyticsQuery,
  useAdminSupportAssigneesQuery,
  useAdminSupportTicketQuery,
  useAdminSupportTicketsQuery,
  useAdminUpdateSupportTicketMutation,
} from '../hooks/use-admin-support';
import { useSupportEvents } from '../hooks/use-support-events';
import {
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  SUPPORT_STATUSES,
} from '../utils/support.constants';
import { formatResponseTime, formatSupportDate, buildSupportConversationThread } from '../utils/support.utils';
import { StatusBadge } from './status-badge';
import { PriorityBadge } from './priority-badge';
import { TicketConversation, TicketTimeline } from './ticket-conversation';
import { TicketReplyBox } from './ticket-reply-box';

export function AdminSupportView() {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    priority: '',
    page: 1,
    limit: 20,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [detailPanelReady, setDetailPanelReady] = useState(false);

  const queryParams = useMemo(() => filters, [filters]);
  const { data: analytics, isLoading: analyticsLoading } = useAdminSupportAnalyticsQuery();
  const { data, isLoading, isError, refetch } = useAdminSupportTicketsQuery(queryParams);
  const exportMutation = useAdminExportSupportTicketsMutation();

  useSupportEvents({ isAdmin: true });

  const tickets = data?.items || [];
  const hasSelection = Boolean(selectedTicketId);

  useEffect(() => {
    if (!selectedTicketId) {
      setDetailPanelReady(false);
      return undefined;
    }

    const frame = requestAnimationFrame(() => setDetailPanelReady(true));
    return () => cancelAnimationFrame(frame);
  }, [selectedTicketId]);

  function closeTicketDetail() {
    setDetailPanelReady(false);
    setSelectedTicketId(null);
  }

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));
  }

  async function handleExport() {
    const csv = await exportMutation.mutateAsync(queryParams);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'support-tickets-export.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading && !data) return <LoadingState message="Loading support tickets..." />;
  if (isError) return <ErrorState message="Failed to load support tickets" onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Support Tickets"
        description="Manage customer queries, assignments, and responses"
        actions={(
          <Button variant="glass" size="sm" onClick={handleExport} disabled={exportMutation.isPending}>
            <Download className="size-4" />
            Export
          </Button>
        )}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard
          title="Total Tickets"
          value={analyticsLoading ? '—' : analytics?.total}
          icon={Ticket}
        />
        <AdminMetricCard
          title="Open"
          value={analyticsLoading ? '—' : analytics?.open}
          icon={Headphones}
        />
        <AdminMetricCard
          title="Pending"
          value={analyticsLoading ? '—' : analytics?.pending}
          icon={Clock3}
        />
        <AdminMetricCard
          title="Critical"
          value={analyticsLoading ? '—' : analytics?.critical}
          icon={AlertTriangle}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AdminMetricCard title="Resolved" value={analyticsLoading ? '—' : analytics?.resolved} icon={CheckCircle2} />
        <AdminMetricCard title="Today" value={analyticsLoading ? '—' : analytics?.today} icon={Ticket} />
        <AdminMetricCard title="Weekly" value={analyticsLoading ? '—' : analytics?.weekly} icon={Ticket} />
        <AdminMetricCard
          title="Avg Response"
          value={analyticsLoading ? '—' : formatResponseTime(analytics?.averageResponseTimeMs)}
          icon={Clock3}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="relative xl:col-span-2">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dashboard-muted" />
          <Input
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Search tickets, email, ticket number..."
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

      <div
        className={cn(
          'flex flex-col gap-6 transition-all duration-300 ease-in-out md:flex-row',
          hasSelection && 'md:items-start',
        )}
      >
        <div
          className={cn(
            'min-w-0 overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-surface',
            'transition-[width,flex,opacity] duration-300 ease-in-out',
            hasSelection
              ? 'hidden w-full md:block md:w-[38%] md:shrink-0 lg:w-[36%]'
              : 'w-full',
          )}
        >
          <table className="w-full text-left text-sm">
            <thead className="border-b border-dashboard-border/60 text-xs uppercase tracking-wider text-dashboard-muted">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className={cn(
                    'cursor-pointer border-b border-dashboard-border/60 transition-colors hover:bg-dashboard-surface-elevated/50',
                    selectedTicketId === ticket.id && 'bg-primary/10 hover:bg-primary/15',
                  )}
                  onClick={() => setSelectedTicketId(ticket.id)}
                >
                  <td className="px-4 py-4">
                    <p className="font-medium text-dashboard-foreground">{ticket.subject}</p>
                    <p className="text-xs text-dashboard-muted">{ticket.ticketNumber}</p>
                  </td>
                  <td className="px-4 py-4 text-dashboard-muted">
                    {ticket.customer?.name || ticket.customer?.email || '—'}
                  </td>
                  <td className="px-4 py-4"><StatusBadge status={ticket.status} /></td>
                  <td className="px-4 py-4"><PriorityBadge priority={ticket.priority} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {hasSelection ? (
          <div
            className={cn(
              'fixed inset-0 z-50 flex flex-col overflow-hidden bg-dashboard-bg',
              'transition-transform duration-300 ease-out md:static md:z-auto md:flex-1 md:overflow-visible md:bg-transparent',
              detailPanelReady ? 'translate-x-0' : 'translate-x-full md:translate-x-0',
              !detailPanelReady && 'md:opacity-0',
              detailPanelReady && 'md:opacity-100 md:transition-opacity',
            )}
          >
            <AdminTicketDetailPanel
              ticketId={selectedTicketId}
              onClose={closeTicketDetail}
              onDeleted={closeTicketDetail}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function AdminTicketDetailPanel({ ticketId, onClose, onDeleted }) {
  const { data: ticket, isLoading, refetch } = useAdminSupportTicketQuery(ticketId);
  const { data: assignees } = useAdminSupportAssigneesQuery();
  const updateMutation = useAdminUpdateSupportTicketMutation();
  const replyMutation = useAdminReplySupportTicketMutation(ticketId);
  const deleteMutation = useAdminDeleteSupportTicketMutation();

  if (isLoading) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto p-4 md:min-h-[420px] md:p-0">
        <div className="mb-4 flex items-center gap-2 md:hidden">
          <Button type="button" variant="glass" size="sm" onClick={onClose}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </div>
        <LoadingState message="Loading ticket details..." />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto p-4 md:min-h-[420px] md:p-0">
        <div className="mb-4 flex items-center gap-2 md:hidden">
          <Button type="button" variant="glass" size="sm" onClick={onClose}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </div>
        <ErrorState message="Ticket not found" onRetry={refetch} />
      </div>
    );
  }

  const isOverdue = ticket.dueDate && new Date(ticket.dueDate) < new Date()
    && !['RESOLVED', 'CLOSED', 'CANCELLED'].includes(ticket.status);

  const conversation = buildSupportConversationThread(ticket, { showInternal: true });

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-0">
      <div className="space-y-4 rounded-2xl border border-dashboard-border bg-dashboard-surface p-4 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <Button
              type="button"
              variant="glass"
              size="sm"
              onClick={onClose}
              className="shrink-0"
              aria-label="Back to ticket list"
            >
              <ArrowLeft className="size-4 md:hidden" />
              <span className="md:hidden">Back</span>
              <X className="hidden size-4 md:block" />
            </Button>
            <div className="min-w-0">
              <p className="text-xs text-dashboard-muted">{ticket.ticketNumber}</p>
              <h2 className="text-xl font-semibold text-dashboard-foreground">{ticket.subject}</h2>
              <p className="mt-1 text-sm text-dashboard-muted">
                {ticket.customer?.name || ticket.customer?.email}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            {isOverdue ? (
              <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs text-red-300">
                Overdue
              </span>
            ) : null}
          </div>
        </div>

      <div className="grid gap-3 md:grid-cols-2">
        <SelectField
          value={ticket.status}
          onChange={(event) => updateMutation.mutate({
            ticketId,
            body: { status: event.target.value },
          })}
        >
          {SUPPORT_STATUSES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </SelectField>
        <SelectField
          value={ticket.priority}
          onChange={(event) => updateMutation.mutate({
            ticketId,
            body: { priority: event.target.value },
          })}
        >
          {SUPPORT_PRIORITIES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </SelectField>
        <SelectField
          value={ticket.category}
          onChange={(event) => updateMutation.mutate({
            ticketId,
            body: { category: event.target.value },
          })}
        >
          {SUPPORT_CATEGORIES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </SelectField>
        <SelectField
          value={ticket.assignedTo?.id || ''}
          onChange={(event) => updateMutation.mutate({
            ticketId,
            body: { assigned_to_id: event.target.value || null },
          })}
        >
          <option value="">Unassigned</option>
          {(assignees || []).map((assignee) => (
            <option key={assignee.id} value={assignee.id}>
              {assignee.profile?.name || assignee.email}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-bg/40 p-4 text-sm text-dashboard-muted">
        <p>Created {formatSupportDate(ticket.createdAt)}</p>
        <p>Due {formatSupportDate(ticket.dueDate)}</p>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-dashboard-foreground">Conversation</h3>
        <div className="max-h-[min(52vh,420px)] overflow-y-auto rounded-xl border border-dashboard-border bg-dashboard-bg/30 p-4">
          <TicketConversation messages={conversation} showInternal viewerIsAdmin />
        </div>
      </div>

      <TicketReplyBox
        allowInternal
        onSubmit={(formData) => replyMutation.mutateAsync(formData)}
        isSubmitting={replyMutation.isPending}
        placeholder="Reply to customer or add internal note..."
      />

      <TicketTimeline activities={ticket.activities} />

      <div className="flex justify-end border-t border-dashboard-border pt-4">
        <Button
          variant="glass"
          size="sm"
          className="border-red-500/30 text-red-300 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-200"
          onClick={async () => {
            await deleteMutation.mutateAsync(ticketId);
            onDeleted?.();
          }}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="size-4" />
          Soft Delete
        </Button>
      </div>
      </div>
    </div>
  );
}
