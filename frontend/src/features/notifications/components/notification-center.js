'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/use-media-query';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CheckCheck, Search, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils/cn';
import { useNotificationEvents } from '../hooks/use-notification-events';
import {
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
  useUnreadNotificationCountQuery,
} from '../hooks/use-notifications';
import { groupNotificationsByDate, NOTIFICATION_FILTERS, USER_NOTIFICATION_FILTERS } from '../utils/notification.utils';
import { NotificationEmptyState } from './notification-empty-state';
import { NotificationItem } from './notification-item';

const DRAWER_TITLE_ID = 'notification-drawer-title';

function NotificationSkeleton() {
  return (
    <div className="animate-pulse space-y-3 px-1">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex gap-3 rounded-xl border border-dashboard-border/40 p-4">
          <div className="size-10 rounded-xl bg-dashboard-surface-elevated" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-dashboard-surface-elevated" />
            <div className="h-3 w-full rounded bg-dashboard-surface-elevated/80" />
            <div className="h-3 w-1/3 rounded bg-dashboard-surface-elevated/60" />
          </div>
        </div>
      ))}
    </div>
  );
}

function useFocusTrap(containerRef, active) {
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!active || !containerRef.current) {
      return undefined;
    }

    previousFocusRef.current = document.activeElement;

    const container = containerRef.current;
    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const getFocusable = () => Array.from(container.querySelectorAll(focusableSelector));

    const focusable = getFocusable();
    focusable[0]?.focus();

    function onKeyDown(event) {
      if (event.key !== 'Tab') {
        return;
      }

      const nodes = getFocusable();

      if (!nodes.length) {
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    container.addEventListener('keydown', onKeyDown);

    return () => {
      container.removeEventListener('keydown', onKeyDown);
      const previous = previousFocusRef.current;

      if (previous && typeof previous.focus === 'function') {
        previous.focus();
      }
    };
  }, [active, containerRef]);
}

export function NotificationCenter({ isAdmin = false, className, triggerClassName, minimalTrigger = false }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [category, setCategory] = useState('ALL');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const scrollRef = useRef(null);
  const drawerRef = useRef(null);

  useNotificationEvents({ enabled: true, isAdmin });
  useFocusTrap(drawerRef, open);

  const unreadQuery = useUnreadNotificationCountQuery(isAdmin);
  const notificationsQuery = useNotificationsQuery({
    category,
    search: debouncedSearch,
    isAdmin,
  });
  const markRead = useMarkNotificationReadMutation(isAdmin);
  const markAllRead = useMarkAllNotificationsReadMutation(isAdmin);

  const unreadCount = unreadQuery.data ?? 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const notifications = useMemo(
    () => notificationsQuery.data?.pages?.flatMap((page) => page.items || []) || [],
    [notificationsQuery.data],
  );

  const grouped = useMemo(() => groupNotificationsByDate(notifications), [notifications]);

  const handleScroll = useCallback(() => {
    const node = scrollRef.current;

    if (!node || !notificationsQuery.hasNextPage || notificationsQuery.isFetchingNextPage) {
      return;
    }

    const threshold = 120;
    const reachedBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - threshold;

    if (reachedBottom) {
      notificationsQuery.fetchNextPage();
    }
  }, [notificationsQuery]);

  const visibleFilters = isAdmin
    ? NOTIFICATION_FILTERS
    : USER_NOTIFICATION_FILTERS;

  const handleMarkAllRead = useCallback(() => {
    markAllRead.mutate();
  }, [markAllRead]);

  const handleClearAll = useCallback(() => {
    markAllRead.mutate(undefined, {
      onSuccess: () => {
        setCategory('ALL');
        setSearch('');
        setOpen(false);
      },
    });
  }, [markAllRead]);

  const handleViewAll = useCallback(() => {
    setCategory('ALL');
    setSearch('');
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const drawer = (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            key="notification-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-[6px]"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
          />

          <motion.aside
            key="notification-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={DRAWER_TITLE_ID}
            initial={isMobile ? { y: '100%' } : { x: '100%' }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: '100%' } : { x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className={cn(
              'fixed z-[110] flex flex-col border-white/[0.1] bg-[#0B1020]/95 shadow-[-12px_0_48px_rgba(0,0,0,0.5)] backdrop-blur-xl',
              isMobile
                ? 'inset-x-0 bottom-0 max-h-[min(88dvh,640px)] rounded-t-[20px] border-t safe-area-bottom'
                : 'inset-y-0 right-0 h-[100dvh] w-full border-l md:w-[400px] lg:w-[440px]',
            )}
          >
            <div className="sticky top-0 z-10 shrink-0 border-b border-white/[0.08] bg-[#0B1020]/90 px-4 py-4 backdrop-blur-xl sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2
                    id={DRAWER_TITLE_ID}
                    className="text-lg font-bold tracking-tight text-dashboard-foreground"
                  >
                    Notifications
                  </h2>
                  <p className="mt-0.5 text-sm text-dashboard-muted">
                    {unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {unreadCount > 0 ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 px-2.5 text-xs text-dashboard-muted hover:text-dashboard-foreground sm:px-3 sm:text-sm"
                        onClick={handleMarkAllRead}
                        disabled={markAllRead.isPending}
                      >
                        <CheckCheck className="mr-1.5 size-4 shrink-0" />
                        <span className="hidden sm:inline">Mark all read</span>
                        <span className="sm:hidden">Read</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-9 px-2.5 text-xs text-dashboard-muted hover:text-red-300 sm:px-3 sm:text-sm"
                        onClick={handleClearAll}
                        disabled={markAllRead.isPending}
                      >
                        <Trash2 className="mr-1.5 size-4 shrink-0" />
                        <span className="hidden sm:inline">Clear all</span>
                        <span className="sm:hidden">Clear</span>
                      </Button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className={cn(
                      'rounded-xl p-2 text-dashboard-muted transition-colors',
                      'hover:bg-white/[0.06] hover:text-dashboard-foreground',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                    )}
                    aria-label="Close notifications"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>

              <div className="relative mt-4">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dashboard-muted"
                  aria-hidden="true"
                />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search notifications..."
                  aria-label="Search notifications"
                  className="h-10 w-full border-white/[0.08] bg-white/[0.04] pl-10 text-dashboard-foreground placeholder:text-dashboard-muted focus-visible:ring-primary/40"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {visibleFilters.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setCategory(filter.id)}
                    aria-pressed={category === filter.id}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                      category === filter.id
                        ? 'bg-primary text-white shadow-[0_0_16px_rgba(124,58,237,0.35)]'
                        : 'bg-white/[0.05] text-dashboard-muted hover:bg-white/[0.08] hover:text-dashboard-foreground',
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4"
            >
              {notificationsQuery.isLoading ? <NotificationSkeleton /> : null}

              {!notificationsQuery.isLoading && !notifications.length ? (
                <NotificationEmptyState />
              ) : null}

              {!notificationsQuery.isLoading && grouped.length > 0 ? (
                <div className="space-y-6">
                  {grouped.map((group) => (
                    <section key={group.id}>
                      <h3 className="mb-2.5 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-dashboard-muted">
                        {group.label}
                      </h3>
                      <div className="space-y-2">
                        {group.items.map((notification) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            isAdmin={isAdmin}
                            onMarkRead={(ids) => markRead.mutate(ids)}
                            onNavigate={() => setOpen(false)}
                          />
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              ) : null}

              {notificationsQuery.isFetchingNextPage ? (
                <p className="py-4 text-center text-xs text-dashboard-muted">Loading more...</p>
              ) : null}
            </div>

            <div className="shrink-0 border-t border-white/[0.08] bg-[#0B1020]/95 px-4 py-3 backdrop-blur-xl sm:px-5">
              <button
                type="button"
                onClick={handleViewAll}
                className={cn(
                  'flex w-full items-center justify-center rounded-xl border border-white/[0.08]',
                  'bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-dashboard-foreground',
                  'transition-all duration-200 hover:-translate-y-px hover:border-primary/30 hover:bg-primary/10',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                )}
              >
                View all notifications
              </button>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );

  return (
    <div className={cn('relative', className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          'relative text-dashboard-muted transition-[transform,color] duration-200',
          minimalTrigger
            ? cn(
                'size-10 shrink-0 rounded-md border border-transparent bg-transparent p-0 shadow-none',
                'transition-all duration-200',
                'hover:scale-105 hover:border-transparent hover:bg-white/[0.06] hover:text-dashboard-foreground',
                'active:scale-95',
                '[&_svg]:!size-[22px] [&_svg]:shrink-0',
                open && 'bg-white/[0.06] text-dashboard-foreground',
              )
            : cn(
                'size-10 [&_svg]:!size-[22px] [&_svg]:shrink-0',
                'hover:text-dashboard-foreground',
                open && 'border-primary/40 bg-white/[0.1] text-dashboard-foreground shadow-[0_8px_28px_rgba(124,58,237,0.28)]',
              ),
          triggerClassName,
        )}
        aria-label="Open notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
      >
        <Bell className="size-[22px]" strokeWidth={2} aria-hidden="true" />
        {unreadCount > 0 ? (
          <span
            className={cn(
              'pointer-events-none absolute -right-1 -top-1 z-10 flex h-4 items-center justify-center rounded-full',
              'border-2 border-dashboard-bg bg-primary font-bold leading-none text-white',
              'shadow-[0_0_8px_rgba(124,58,237,0.45)]',
              unreadCount > 99
                ? 'min-w-[1.375rem] px-1 text-[8px]'
                : unreadCount > 9
                  ? 'min-w-[1.125rem] px-1 text-[9px]'
                  : 'min-w-4 px-0 text-[10px]',
            )}
            aria-hidden="true"
          >
            <span className="absolute inset-0 animate-ping rounded-full bg-primary/70 opacity-50" />
            <span className="relative tabular-nums">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </span>
        ) : null}
      </Button>

      {mounted ? createPortal(drawer, document.body) : null}
    </div>
  );
}
