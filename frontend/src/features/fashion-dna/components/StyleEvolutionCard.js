'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';

export function StyleEvolutionCard({ styleEvolution = [], className }) {
  const items = (styleEvolution || []).slice(0, 6);

  return (
    <section
      className={cn(
        'rounded-[24px] border border-dashboard-border bg-[#1A2235] p-6 shadow-lg',
        className,
      )}
    >
      <div className="mb-2">
        <h3 className="text-base font-semibold text-dashboard-foreground">
          Style Evolution
        </h3>
        <p className="mt-1 text-xs text-dashboard-muted">Last 90 days vs prior activity</p>
      </div>

      {items.length ? (
        <div className="mt-5 space-y-3">
          {items.map((entry) => {
            const rising = entry.delta >= 0;

            return (
              <div
                key={entry.axis}
                className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-dashboard-foreground">{entry.axis}</p>
                  <p className="text-xs text-dashboard-muted">
                    {entry.previous}% → {entry.current}%
                  </p>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-sm font-semibold',
                    rising ? 'text-emerald-400' : 'text-rose-400',
                  )}
                >
                  {rising ? (
                    <TrendingUp className="size-4" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="size-4" aria-hidden="true" />
                  )}
                  {rising ? '+' : ''}
                  {entry.delta}%
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-5 text-sm text-dashboard-muted">
          Not enough activity history yet to detect style shifts.
        </p>
      )}
    </section>
  );
}
