'use client';

import { cn } from '@/utils/cn';

function renderItems(items, variant) {
  if (variant === 'chips') {
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className={cn(
              'rounded-full border border-primary/25 bg-[#8B5CF6]/10',
              'px-3 py-1.5 text-xs font-medium text-dashboard-foreground',
            )}
          >
            {item}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          className="flex items-center justify-between gap-4 text-sm"
        >
          <span className="text-dashboard-muted">{item.label}</span>
          <span className="text-right font-medium text-dashboard-foreground">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function DnaInsightCard({
  title,
  icon: Icon,
  items = [],
  variant = 'rows',
  className,
}) {
  return (
    <section
      className={cn(
        'flex h-full flex-col rounded-[24px] border border-dashboard-border',
        'bg-[#1A2235] p-6 shadow-lg',
        className,
      )}
    >
      <div className="mb-5 flex items-center gap-2">
        {Icon ? (
          <Icon className="size-4 text-[#8B5CF6]" aria-hidden="true" />
        ) : null}
        <h3 className="text-base font-semibold text-dashboard-foreground">{title}</h3>
      </div>

      <div className="flex-1">{renderItems(items, variant)}</div>
    </section>
  );
}
