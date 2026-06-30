'use client';

import Link from 'next/link';
import { memo } from 'react';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export const StatCard = memo(function StatCard({
  title,
  value,
  trend,
  icon: Icon,
  iconClassName,
  isMock = false,
  isLoading = false,
  href,
  className,
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'flex size-10 items-center justify-center rounded-xl',
            iconClassName,
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>

        <div className="flex flex-col items-end gap-1">
          {isMock ? (
            <Badge
              variant="secondary"
              className="border-dashboard-border bg-dashboard-surface-elevated text-[10px] text-dashboard-muted"
            >
              Sample data
            </Badge>
          ) : null}
          <span className="text-xs font-medium text-dashboard-muted">{trend}</span>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <p className="text-sm text-dashboard-muted">{title}</p>
        {isLoading ? (
          <Skeleton className="h-9 w-20 rounded-lg bg-dashboard-surface-elevated" />
        ) : (
          <p className="text-3xl font-bold text-dashboard-foreground">{value}</p>
        )}
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          'interactive-card block rounded-2xl border border-dashboard-border bg-dashboard-surface p-5',
          isLoading && 'animate-pulse',
          className,
        )}
        {...(isMock ? { 'data-mock': 'true' } : {})}
      >
        {content}
      </Link>
    );
  }

  return (
    <article
      className={cn(
        'interactive-card rounded-2xl border border-dashboard-border bg-dashboard-surface p-5',
        isLoading && 'animate-pulse',
        className,
      )}
      {...(isMock ? { 'data-mock': 'true' } : {})}
    >
      {content}
    </article>
  );
});
