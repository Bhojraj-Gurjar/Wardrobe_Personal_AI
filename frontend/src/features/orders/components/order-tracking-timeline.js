'use client';

import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';
import {
  buildTrackingSteps,
  calculateTrackingProgress,
  formatActorLabel,
  formatTrackingDateTime,
} from '@/features/orders/utils/order-tracking.utils';
import { cn } from '@/utils/cn';

function ProgressBar({ progress }) {
  const markers = [0, 25, 50, 75, 100];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-dashboard-muted">
        <span>Progress</span>
        <span className="text-primary">{progress}%</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-dashboard-border/60">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/80 to-purple-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-dashboard-muted">
        {markers.map((marker) => (
          <span key={marker}>{marker}%</span>
        ))}
      </div>
    </div>
  );
}

export function OrderTrackingTimeline({ order }) {
  const steps = buildTrackingSteps(order);
  const progress = calculateTrackingProgress(steps);

  return (
    <div className="space-y-6">
      <ProgressBar progress={progress} />

      <ol className="max-h-[min(52vh,420px)] space-y-0 overflow-y-auto pr-1">
        {steps.map((step, index) => {
          const { date, time } = formatTrackingDateTime(step.timestamp);
          const isComplete = step.state === 'complete';
          const isCurrent = step.state === 'current';

          return (
            <motion.li
              key={step.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04, duration: 0.25 }}
              className="relative flex gap-4 pb-8 last:pb-0"
            >
              {index < steps.length - 1 ? (
                <span
                  className={cn(
                    'absolute left-[17px] top-9 h-[calc(100%-12px)] w-px',
                    isComplete ? 'bg-primary/50' : 'bg-dashboard-border/70',
                  )}
                />
              ) : null}

              <span
                className={cn(
                  'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border transition-all',
                  isComplete && 'border-primary bg-primary text-white shadow-[0_0_18px_rgba(168,85,247,0.45)]',
                  isCurrent && 'border-primary/70 bg-primary/15 text-primary shadow-[0_0_24px_rgba(168,85,247,0.35)]',
                  !isComplete && !isCurrent && 'border-dashboard-border/80 bg-dashboard-bg/40 text-dashboard-muted',
                )}
              >
                {isCurrent ? (
                  <motion.span
                    className="absolute inset-0 rounded-full border border-primary/40"
                    animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                ) : null}
                {isComplete ? (
                  <Check className="size-4" />
                ) : (
                  <Circle className={cn('size-3', isCurrent && 'fill-primary text-primary')} />
                )}
              </span>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={cn(
                      'font-semibold',
                      isComplete && 'text-dashboard-foreground',
                      isCurrent && 'text-primary',
                      !isComplete && !isCurrent && 'text-dashboard-muted',
                    )}
                  >
                    {step.label}
                  </p>
                  {isCurrent ? (
                    <span className="rounded-full border border-primary/35 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      Current Status
                    </span>
                  ) : null}
                </div>

                {isComplete || isCurrent ? (
                  <div className="mt-1 space-y-0.5 text-xs text-dashboard-muted">
                    <p>{date} · {time}</p>
                    {(step.actorRole || step.entry) ? (
                      <p>Updated by {formatActorLabel(step.actorRole)}</p>
                    ) : null}
                    {step.notes ? (
                      <p className="italic text-dashboard-muted/90">{step.notes}</p>
                    ) : null}
                    {step.key === 'transit' && order?.tracking_number ? (
                      <p className="text-primary">
                        {order.courier_name || 'Courier'} · {order.tracking_number}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
