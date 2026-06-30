'use client';

import Link from 'next/link';
import { cn } from '@/utils/cn';

export function UserProfileCard({
  name,
  subtitle,
  collapsed = false,
  className,
  href,
  onNavigate,
}) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const content = (
    <>
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full',
          'bg-primary text-sm font-semibold text-primary-foreground',
        )}
        aria-hidden="true"
      >
        {initials}
      </span>
      {!collapsed ? (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-dashboard-foreground">
            {name}
          </p>
          <p className="truncate text-xs text-dashboard-muted">{subtitle}</p>
        </div>
      ) : null}
    </>
  );

  const rootClassName = cn(
    'flex items-center gap-3 rounded-xl border border-dashboard-border',
    'bg-dashboard-surface-elevated p-3',
    href && 'transition-all duration-200 hover:border-primary/30 hover:bg-primary/5',
    className,
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className={rootClassName}
        aria-label="Go to profile"
      >
        {content}
      </Link>
    );
  }

  return <div className={rootClassName}>{content}</div>;
}
