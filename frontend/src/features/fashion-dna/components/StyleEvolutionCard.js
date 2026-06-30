'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  fashionDnaCardShell,
  fashionDnaCardSubtitleClass,
  fashionDnaCardTitleClass,
} from '@/features/fashion-dna/utils/fashion-dna-card-styles';

export function StyleEvolutionCard({ styleEvolution = [], className }) {
  const items = (styleEvolution || []).slice(0, 6);

  return (
    <section className={fashionDnaCardShell(className)}>
      <div>
        <h3 className={fashionDnaCardTitleClass}>Style Evolution</h3>
        <p className={fashionDnaCardSubtitleClass}>Last 90 days vs prior activity</p>
      </div>

      {items.length ? (
        <div className="mt-3 space-y-2 md:mt-5 md:space-y-3">
          {items.map((entry) => {
            const rising = entry.delta >= 0;

            return (
              <div
                key={entry.axis}
                className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 md:px-4 md:py-3"
              >
                <div>
                  <p className="text-xs font-medium text-dashboard-foreground md:text-sm">{entry.axis}</p>
                  <p className="text-[11px] text-dashboard-muted md:text-xs">
                    {entry.previous}% → {entry.current}%
                  </p>
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-xs font-semibold md:text-sm',
                    rising ? 'text-emerald-400' : 'text-rose-400',
                  )}
                >
                  {rising ? (
                    <TrendingUp className="size-3.5 md:size-4" aria-hidden="true" />
                  ) : (
                    <TrendingDown className="size-3.5 md:size-4" aria-hidden="true" />
                  )}
                  {rising ? '+' : ''}
                  {entry.delta}%
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-xs text-dashboard-muted md:mt-5 md:text-sm">
          Not enough activity history yet to detect style shifts.
        </p>
      )}
    </section>
  );
}
