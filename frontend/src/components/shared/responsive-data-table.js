'use client';

import { cn } from '@/utils/cn';

/**
 * Responsive table wrapper.
 * Desktop: standard table with optional horizontal scroll on tablet.
 * Mobile: stacked card list via renderMobileCard.
 */
export function ResponsiveDataTable({
  children,
  renderMobileCard,
  items = [],
  className,
  tableClassName,
  mobileClassName,
}) {
  return (
    <div className={cn('w-full min-w-0', className)}>
      <div className={cn('hidden md:block overflow-x-auto', tableClassName)}>
        {children}
      </div>

      {renderMobileCard ? (
        <div className={cn('space-y-3 md:hidden', mobileClassName)}>
          {items.map((item, index) => (
            <div key={item?.id ?? index}>{renderMobileCard(item, index)}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ResponsiveTableCard({ children, onClick, className }) {
  return (
    <article
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick(event);
        }
      } : undefined}
      className={cn(
        'rounded-2xl border border-dashboard-border bg-dashboard-surface p-4 shadow-sm',
        'transition-colors hover:border-primary/20',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </article>
  );
}

export function ResponsiveTableRow({ label, children, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 py-1.5 text-sm', className)}>
      <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-dashboard-muted">
        {label}
      </span>
      <span className="min-w-0 text-right text-dashboard-foreground">{children}</span>
    </div>
  );
}
