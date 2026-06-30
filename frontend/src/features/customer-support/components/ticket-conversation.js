'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, FileText, ImageOff, Paperclip } from 'lucide-react';
import { isAdminUser } from '@/features/admin/utils/is-admin-user';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/utils/cn';
import { formatSupportDate, resolveAttachmentUrl, resolveIsOwnSupportMessage } from '../utils/support.utils';

export function TicketConversation({
  messages = [],
  showInternal = false,
  isLoading = false,
  className,
  viewerIsAdmin = false,
}) {
  const endRef = useRef(null);
  const authUser = useAuthStore((state) => state.user);
  const resolvedViewerIsAdmin = viewerIsAdmin || isAdminUser(authUser);
  const currentUserId = authUser?.id || authUser?.userId || null;

  const visibleMessages = messages.filter((message) => showInternal || !message.isInternal);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages.length, isLoading]);

  if (isLoading) {
    return (
      <div className={cn('flex min-h-[200px] items-center justify-center text-sm text-dashboard-muted', className)}>
        Loading conversation…
      </div>
    );
  }

  if (!visibleMessages.length) {
    return (
      <div className={cn('flex min-h-[200px] flex-col items-center justify-center gap-2 text-center', className)}>
        <Paperclip className="size-8 text-dashboard-muted/60" />
        <p className="text-sm font-medium text-dashboard-foreground">No messages yet</p>
        <p className="max-w-xs text-xs text-dashboard-muted">
          Replies will appear here in chronological order.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {visibleMessages.map((message) => {
        const isAdmin = message.authorType === 'ADMIN';
        const isSystem = message.authorType === 'SYSTEM';
        const isUser = message.authorType === 'USER';
        const isOwnMessage = resolveIsOwnSupportMessage(message, {
          currentUserId,
          viewerIsAdmin: resolvedViewerIsAdmin,
        });
        const senderLabel = message.isInternal
          ? 'Internal Note'
          : isUser
            ? (message.author?.name || message.author?.email || 'Customer')
            : isAdmin
              ? (message.author?.name || message.author?.email || 'Support Team')
              : (message.author?.name || message.author?.email || message.authorType);

        return (
          <div
            key={message.id}
            className={cn(
              'flex',
              isOwnMessage ? 'justify-end' : 'justify-start',
            )}
          >
            <div
              className={cn(
                'max-w-[88%] rounded-2xl border px-4 py-3 shadow-sm',
                message.isInternal
                  ? 'border-amber-500/30 bg-amber-500/10'
                  : isAdmin || isSystem
                    ? 'border-purple-500/35 bg-purple-500/10'
                    : 'border-dashboard-border bg-dashboard-bg/70',
              )}
            >
              <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-dashboard-muted">
                <span className="font-semibold text-dashboard-foreground">{senderLabel}</span>
                {message.isOpeningMessage ? (
                  <span className="rounded-full bg-dashboard-accent-soft px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                    Original request
                  </span>
                ) : null}
                <span>{formatSupportDate(message.createdAt)}</span>
                {message.isRead ? <span className="text-primary/80">Seen</span> : null}
              </div>

              <p className="whitespace-pre-wrap text-sm leading-relaxed text-dashboard-foreground">
                {message.body}
              </p>

              {message.attachments?.length ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {message.attachments.map((attachment) => (
                    <AttachmentPreview key={attachment.id} attachment={attachment} />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

export function AttachmentPreview({ attachment }) {
  const [broken, setBroken] = useState(false);
  const href = resolveAttachmentUrl(attachment.publicUrl);
  const isImage = attachment.mimeType?.startsWith('image/');
  const isPdf = attachment.mimeType === 'application/pdf';

  if (!href) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-dashboard-border/80 bg-dashboard-bg/40 p-3 text-sm text-dashboard-muted">
        <ImageOff className="size-5 shrink-0" />
        <span>Attachment unavailable</span>
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      download={attachment.fileName}
      className="group flex items-center gap-3 rounded-xl border border-dashboard-border/70 bg-dashboard-bg/50 p-2.5 transition-colors hover:border-primary/35 hover:bg-dashboard-surface-elevated/60"
    >
      {isImage && !broken ? (
        <img
          src={href}
          alt={attachment.fileName}
          className="size-14 shrink-0 rounded-lg object-cover"
          loading="lazy"
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-dashboard-accent-soft">
          <FileText className="size-5 text-primary" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-dashboard-foreground group-hover:text-primary">
          {attachment.fileName}
        </p>
        <p className="text-xs text-dashboard-muted">
          {attachment.fileSize ? `${(attachment.fileSize / 1024).toFixed(1)} KB` : 'File'}
          {isPdf ? ' · PDF' : isImage ? ' · Image' : ''}
        </p>
      </div>
      <Download className="size-4 shrink-0 text-dashboard-muted group-hover:text-primary" />
    </a>
  );
}

export function TicketAttachmentsPanel({ attachments = [], title = 'Attachments' }) {
  if (!attachments.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-dashboard-foreground">{title}</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {attachments.map((attachment) => (
          <AttachmentPreview key={attachment.id} attachment={attachment} />
        ))}
      </div>
    </div>
  );
}

export function TicketTimeline({ activities = [] }) {
  if (!activities.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-dashboard-foreground">Activity Log</h3>
      {activities.map((activity) => (
        <div key={activity.id} className="flex gap-3 text-sm">
          <div className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
          <div>
            <p className="text-dashboard-foreground">
              {activity.activityType.replace(/_/g, ' ').toLowerCase()}
              {activity.newValue ? `: ${activity.newValue.replace(/_/g, ' ').toLowerCase()}` : ''}
            </p>
            <p className="text-xs text-dashboard-muted">
              {activity.actor?.name || activity.actor?.email || 'System'} · {formatSupportDate(activity.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
