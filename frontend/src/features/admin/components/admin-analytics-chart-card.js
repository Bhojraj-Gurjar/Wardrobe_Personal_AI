'use client';

import Link from 'next/link';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export function AdminAnalyticsChartCard({
  title,
  description,
  href,
  children,
  footer,
  isLoading = false,
  isEmpty = false,
  emptyMessage = 'No data available yet.',
  className,
}) {
  const content = (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border border-dashboard-border bg-dashboard-surface p-5',
        'transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_16px_40px_rgba(124,58,237,0.12)]',
        href && 'cursor-pointer',
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-dashboard-foreground">{title}</h3>
          {description ? (
            <p className="mt-1 text-sm text-dashboard-muted">{description}</p>
          ) : null}
        </div>
        {href ? (
          <span className="flex size-8 items-center justify-center rounded-full border border-dashboard-border bg-dashboard-bg/50 text-dashboard-muted transition group-hover:border-primary/40 group-hover:text-primary">
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </span>
        ) : null}
      </div>

      <div className="relative min-h-[16rem]">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-sm text-dashboard-muted">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Loading chart…
          </div>
        ) : isEmpty ? (
          <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-dashboard-border bg-dashboard-bg/30 px-6 text-center text-sm text-dashboard-muted">
            {emptyMessage}
          </div>
        ) : (
          children
        )}
      </div>

      {footer ? <div className="mt-4">{footer}</div> : null}
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
      {content}
    </Link>
  );
}
