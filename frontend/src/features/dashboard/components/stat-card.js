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
      <div className="flex items-start justify-between gap-2 md:gap-3">
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-lg md:size-10 md:rounded-xl',
            iconClassName,
          )}
        >
          <Icon className="size-3.5 md:size-5" aria-hidden="true" />
        </span>

        <div className="flex min-w-0 flex-col items-end gap-0.5 md:gap-1">
          {isMock ? (
            <Badge
              variant="secondary"
              className="border-dashboard-border bg-dashboard-surface-elevated px-1.5 py-0 text-[9px] text-dashboard-muted md:text-[10px]"
            >
              Sample
            </Badge>
          ) : null}
          <span className="line-clamp-2 text-right text-[10px] font-medium leading-tight text-dashboard-muted md:text-xs">
            {trend}
          </span>
        </div>
      </div>

      <div className="mt-2 space-y-0.5 md:mt-4 md:space-y-1">
        <p className="truncate text-[11px] text-dashboard-muted md:text-sm">{title}</p>
        {isLoading ? (
          <Skeleton className="h-6 w-14 rounded-lg bg-dashboard-surface-elevated md:h-9 md:w-20" />
        ) : (
          <p className="text-[1.375rem] font-bold leading-none text-dashboard-foreground md:text-3xl">
            {value}
          </p>
        )}
      </div>
    </>
  );

  const cardClassName = cn(
    'interactive-card rounded-xl border border-dashboard-border bg-dashboard-surface',
    'flex min-h-[6rem] max-h-[6.875rem] flex-col justify-between p-3',
    'md:min-h-0 md:max-h-none md:rounded-2xl md:p-5',
    isLoading && 'animate-pulse',
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cardClassName}
        {...(isMock ? { 'data-mock': 'true' } : {})}
      >
        {content}
      </Link>
    );
  }

  return (
    <article
      className={cardClassName}
      {...(isMock ? { 'data-mock': 'true' } : {})}
    >
      {content}
    </article>
  );
});
