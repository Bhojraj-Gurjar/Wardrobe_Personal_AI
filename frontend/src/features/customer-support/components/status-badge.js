'use client';

import { cn } from '@/utils/cn';
import { STATUS_BADGE_STYLES, SUPPORT_STATUSES } from '../utils/support.constants';

export function StatusBadge({ status, className }) {
  const label = SUPPORT_STATUSES.find((item) => item.value === status)?.label
    || status?.replace(/_/g, ' ');

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize',
        STATUS_BADGE_STYLES[status] || 'bg-dashboard-accent-soft text-dashboard-foreground border-dashboard-border',
        className,
      )}
    >
      {label}
    </span>
  );
}
