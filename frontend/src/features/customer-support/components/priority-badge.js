'use client';

import { cn } from '@/utils/cn';
import { PRIORITY_BADGE_STYLES, SUPPORT_PRIORITIES } from '../utils/support.constants';

export function PriorityBadge({ priority, className }) {
  const label = SUPPORT_PRIORITIES.find((item) => item.value === priority)?.label || priority;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        PRIORITY_BADGE_STYLES[priority] || 'bg-dashboard-accent-soft text-dashboard-foreground border-dashboard-border',
        className,
      )}
    >
      {label}
    </span>
  );
}
