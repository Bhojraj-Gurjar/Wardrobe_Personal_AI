'use client';

import { Check } from 'lucide-react';
import { resolveOrderStatusConfig } from '@/features/orders/utils/order-status';
import { cn } from '@/utils/cn';

const CUSTOMER_TIMELINE_STEPS = [
  { key: 'placed', label: 'Order Placed', match: ['CREATED'] },
  { key: 'accepted', label: 'Accepted', match: ['CONFIRMED'] },
  { key: 'packed', label: 'Packed / Ready To Dispatch', match: ['PACKING', 'PACKED', 'READY_TO_DISPATCH'] },
  { key: 'transit', label: 'In Transit', match: ['SHIPPED', 'READY_FOR_HANDOVER'] },
  { key: 'delivered', label: 'Delivered / Completed', match: ['COMPLETED', 'DELIVERED'] },
];

const ADMIN_TIMELINE_STEPS = [
  { key: 'placed', label: 'Order Placed', match: ['CREATED'] },
  { key: 'accepted', label: 'Accepted', match: ['CONFIRMED'] },
  { key: 'packed', label: 'Packed / Ready To Dispatch', match: ['PACKING', 'PACKED', 'READY_TO_DISPATCH'] },
  { key: 'transit', label: 'In Transit', match: ['SHIPPED', 'READY_FOR_HANDOVER'] },
  { key: 'completed', label: 'Delivered / Completed', match: ['COMPLETED', 'DELIVERED'] },
];

const STATUS_RANK = {
  CREATED: 0,
  CONFIRMED: 1,
  PACKING: 3,
  PACKED: 4,
  READY_TO_DISPATCH: 4,
  READY_FOR_HANDOVER: 5,
  SHIPPED: 5,
  DELIVERED: 6,
  COMPLETED: 6,
};

export function OrderTimeline({ order, variant = 'customer' }) {
  const steps = variant === 'admin' ? ADMIN_TIMELINE_STEPS : CUSTOMER_TIMELINE_STEPS;
  const rank = STATUS_RANK[order?.status] ?? 0;
  const flags = order?.oms_flags || {};

  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        let complete = false;

        if (step.flag) {
          complete = Boolean(flags[step.flag]);
        } else if (step.match) {
          complete = step.match.some((status) => (STATUS_RANK[status] ?? -1) <= rank);
        }

        const timelineEntry = order?.timeline?.find((entry) =>
          entry.action?.includes(step.key.toUpperCase()) || step.match?.includes(entry.to_status),
        );

        return (
          <li key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
            {index < steps.length - 1 ? (
              <span className={cn('absolute left-[15px] top-8 h-[calc(100%-8px)] w-px', complete ? 'bg-primary/60' : 'bg-dashboard-border')} />
            ) : null}
            <span
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border',
                complete ? 'border-primary bg-primary text-white' : 'border-dashboard-border bg-dashboard-surface text-dashboard-muted',
              )}
            >
              {complete ? <Check className="size-4" /> : <span className="size-2 rounded-full bg-current" />}
            </span>
            <div>
              <p className={cn('font-medium', complete ? 'text-dashboard-foreground' : 'text-dashboard-muted')}>
                {step.label}
                {step.key === 'delivered' && complete ? ' ✅' : ''}
              </p>
              {timelineEntry?.created_at ? (
                <p className="mt-1 text-xs text-dashboard-muted">
                  {new Date(timelineEntry.created_at).toLocaleString('en-IN')}
                </p>
              ) : null}
              {step.key === 'transit' && order?.tracking_number ? (
                <p className="mt-1 text-xs text-primary">
                  {order.courier_name || 'Courier'} · {order.tracking_number}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function StatusBadge({ status }) {
  const config = resolveOrderStatusConfig(status);

  return (
    <span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold', config.badgeClass)}>
      <span className={cn('size-2 rounded-full', config.dotClass)} />
      {config.label}
    </span>
  );
}
