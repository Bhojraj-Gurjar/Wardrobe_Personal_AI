'use client';

import { cn } from '@/utils/cn';

export function Progress({ className, value = 0, indicatorClassName, ...props }) {
  const clampedValue = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div
      className={cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-dashboard-border/60',
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          'h-full rounded-full bg-primary transition-all duration-500',
          indicatorClassName,
        )}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
