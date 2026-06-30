'use client';

import Link from 'next/link';
import { cn } from '@/utils/cn';
import {
  formatRelativeTime,
  resolveNotificationHref,
  resolveNotificationIcon,
} from '../utils/notification.utils';

const CATEGORY_STYLES = {
  ORDERS: 'bg-blue-500/15 text-blue-300',
  SUPPORT: 'bg-emerald-500/15 text-emerald-300',
  SHOPPING: 'bg-amber-500/15 text-amber-300',
  SECURITY: 'bg-rose-500/15 text-rose-300',
  SYSTEM: 'bg-slate-500/15 text-slate-300',
  PROFILE: 'bg-violet-500/15 text-violet-300',
  ADMIN: 'bg-primary/15 text-primary',
};

export function NotificationItem({
  notification,
  isAdmin = false,
  onMarkRead,
  onNavigate,
}) {
  const Icon = resolveNotificationIcon(notification);
  const href = resolveNotificationHref(notification, isAdmin);
  const categoryStyle = CATEGORY_STYLES[notification.category] || CATEGORY_STYLES.SYSTEM;

  function handleClick() {
    if (!notification.isRead && onMarkRead) {
      onMarkRead([notification.id]);
    }

    if (onNavigate) {
      onNavigate();
    }
  }

  const content = (
    <div
      className={cn(
        'group flex gap-3 rounded-xl border px-3.5 py-3.5 transition-all duration-200 sm:px-4',
        'hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)]',
        'active:translate-y-0 active:scale-[0.995]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
        notification.isRead
          ? 'border-transparent bg-transparent hover:border-white/[0.08] hover:bg-white/[0.04]'
          : 'border-primary/25 bg-primary/[0.07] hover:border-primary/35 hover:bg-primary/10',
      )}
    >
      <div
        className={cn(
          'mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors',
          notification.isRead ? 'bg-white/[0.06]' : 'bg-primary/15',
        )}
      >
        <Icon
          className={cn('size-4', notification.isRead ? 'text-dashboard-muted' : 'text-primary')}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm font-semibold leading-snug',
              notification.isRead ? 'text-dashboard-foreground/80' : 'text-dashboard-foreground',
            )}
          >
            {notification.title}
          </p>
          {!notification.isRead ? (
            <span
              className="mt-1.5 size-2 shrink-0 rounded-full bg-primary shadow-[0_0_8px_rgba(124,58,237,0.8)]"
              aria-hidden="true"
            />
          ) : null}
        </div>

        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-dashboard-muted">
          {notification.description}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              categoryStyle,
            )}
          >
            {notification.category}
          </span>
          <span className="text-xs text-dashboard-muted">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={handleClick}
        className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="block w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      {content}
    </button>
  );
}
