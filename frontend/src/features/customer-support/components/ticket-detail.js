'use client';

import Link from 'next/link';
import { ArrowLeft, RotateCcw, XCircle } from 'lucide-react';
import { LoadingState } from '@/components/shared/loading-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent } from '@/components/ui/glass-card';
import { ROUTES } from '@/constants/routes';
import {
  useCloseSupportTicketMutation,
  useReplySupportTicketMutation,
  useReopenSupportTicketMutation,
  useSupportTicketQuery,
} from '../hooks/use-support-tickets';
import { SUPPORT_CATEGORIES } from '../utils/support.constants';
import { formatSupportDate, formatResponseTime, buildSupportConversationThread, isSupportTicketReplyDisabled } from '../utils/support.utils';
import { StatusBadge } from './status-badge';
import { PriorityBadge } from './priority-badge';
import { TicketConversation } from './ticket-conversation';
import { TicketReplyBox } from './ticket-reply-box';

export function TicketDetailView({ ticketId }) {
  const { data: ticket, isLoading, isError, refetch } = useSupportTicketQuery(ticketId);
  const replyMutation = useReplySupportTicketMutation(ticketId);
  const closeMutation = useCloseSupportTicketMutation();
  const reopenMutation = useReopenSupportTicketMutation();

  if (isLoading) return <LoadingState message="Loading ticket..." />;
  if (isError || !ticket) return <ErrorState message="Ticket not found" onRetry={refetch} />;

  const canClose = !['CLOSED', 'CANCELLED'].includes(ticket.status);
  const canReopen = ['RESOLVED', 'CLOSED'].includes(ticket.status);
  const replyDisabled = isSupportTicketReplyDisabled(ticket.status);
  const responseTime = ticket.firstResponseAt
    ? new Date(ticket.firstResponseAt).getTime() - new Date(ticket.createdAt).getTime()
    : null;

  const conversation = buildSupportConversationThread(ticket);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" className="text-dashboard-muted hover:text-dashboard-foreground">
          <Link href={ROUTES.SUPPORT.TICKETS}>
            <ArrowLeft className="mr-2 size-4" />
            Back to tickets
          </Link>
        </Button>
        <div className="flex gap-2">
          {canReopen ? (
            <Button
              variant="outline"
              onClick={() => reopenMutation.mutate(ticketId)}
              disabled={reopenMutation.isPending}
            >
              <RotateCcw className="mr-2 size-4" />
              Reopen
            </Button>
          ) : null}
          {canClose ? (
            <Button
              variant="outline"
              className="border-red-500/30 text-red-300 hover:bg-red-500/10"
              onClick={() => closeMutation.mutate(ticketId)}
              disabled={closeMutation.isPending}
            >
              <XCircle className="mr-2 size-4" />
              Close Ticket
            </Button>
          ) : null}
        </div>
      </div>

      <GlassCard>
        <GlassCardContent className="space-y-6 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-dashboard-muted">{ticket.ticketNumber}</p>
              <h1 className="mt-1 text-2xl font-bold text-white">{ticket.subject}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge status={ticket.status} />
                <PriorityBadge priority={ticket.priority} />
              </div>
            </div>
            <div className="text-sm text-dashboard-muted">
              <p>Created {formatSupportDate(ticket.createdAt)}</p>
              <p>Updated {formatSupportDate(ticket.updatedAt)}</p>
              <p>Response time {formatResponseTime(responseTime)}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoItem label="Category" value={SUPPORT_CATEGORIES.find((item) => item.value === ticket.category)?.label} />
            <InfoItem label="Assigned To" value={ticket.assignedTo?.name || ticket.assignedTo?.email || 'Unassigned'} />
            <InfoItem label="Contact" value={ticket.contactMethod?.replace(/_/g, ' ')} />
            <InfoItem label="Due Date" value={formatSupportDate(ticket.dueDate)} />
          </div>
        </GlassCardContent>
      </GlassCard>

      <section className="overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashboard-border/60 px-4 py-3 md:px-6">
          <h2 className="text-lg font-semibold text-dashboard-foreground">Conversation</h2>
          {ticket.status === 'RESOLVED' ? (
            <StatusBadge status="RESOLVED" />
          ) : null}
        </div>

        <div className="max-h-[min(65vh,560px)] overflow-y-auto px-4 py-4 md:px-6">
          <TicketConversation messages={conversation} isLoading={replyMutation.isPending} />
        </div>

        <div className="border-t border-dashboard-border/60 p-4 md:p-6">
          <TicketReplyBox
            onSubmit={(formData) => replyMutation.mutateAsync(formData)}
            isSubmitting={replyMutation.isPending}
            disabled={replyDisabled}
            disabledMessage={
              ticket.status === 'RESOLVED'
                ? 'This ticket has been resolved.'
                : 'This ticket is closed and no longer accepts replies.'
            }
          />
        </div>
      </section>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-xl border border-dashboard-border/60 bg-dashboard-surface px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-dashboard-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-dashboard-foreground">{value || '—'}</p>
    </div>
  );
}
