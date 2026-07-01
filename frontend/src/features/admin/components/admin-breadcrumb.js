'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

export function AdminBreadcrumb({ items = [], className }) {
  if (!items.length) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn('flex flex-wrap items-center gap-1 text-sm', className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="flex items-center gap-1">
            {index > 0 ? (
              <ChevronRight className="size-3.5 shrink-0 text-dashboard-muted/60" aria-hidden="true" />
            ) : null}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-dashboard-muted transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast ? 'font-medium text-dashboard-foreground' : 'text-dashboard-muted')}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
