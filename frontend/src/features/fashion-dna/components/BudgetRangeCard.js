'use client';

import { IndianRupee } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/cn';

export function BudgetRangeCard({
  budgetRangeLabel,
  budgetType,
  averageSpending,
  spendProgress,
  className,
}) {
  const spendLabel = averageSpending
    ? `₹${Math.round(Number(averageSpending)).toLocaleString('en-IN')}`
    : '—';

  return (
    <section
      className={cn(
        'flex h-full flex-col rounded-[24px] border border-dashboard-border',
        'bg-[#1A2235] p-6 shadow-lg',
        className,
      )}
    >
      <div className="mb-5 flex items-center gap-2">
        <IndianRupee className="size-4 text-[#8B5CF6]" aria-hidden="true" />
        <h3 className="text-base font-semibold text-dashboard-foreground">
          Budget Profile
        </h3>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-2xl font-bold text-dashboard-foreground">
            {budgetRangeLabel || 'Building profile'}
          </p>
          <p className="mt-1 text-xs text-dashboard-muted">Preferred range</p>
        </div>

        {budgetType ? (
          <div>
            <p className="text-lg font-semibold text-[#FFC107]">{budgetType}</p>
            <p className="mt-1 text-xs text-dashboard-muted">Budget type</p>
          </div>
        ) : null}

        <div>
          <p className="text-2xl font-bold text-dashboard-foreground">{spendLabel}</p>
          <p className="mt-1 text-xs text-dashboard-muted">Average interaction value</p>
        </div>
      </div>

      {averageSpending ? (
        <Progress value={spendProgress || 0} className="mt-auto h-2" />
      ) : null}
    </section>
  );
}
