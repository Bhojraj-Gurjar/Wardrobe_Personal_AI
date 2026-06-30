'use client';

import { IndianRupee } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/utils/cn';
import {
  fashionDnaCardHeaderGapClass,
  fashionDnaCardShell,
  fashionDnaCardTitleClass,
} from '@/features/fashion-dna/utils/fashion-dna-card-styles';

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
    <section className={fashionDnaCardShell(className)}>
      <div className={cn('flex items-center gap-2', fashionDnaCardHeaderGapClass)}>
        <IndianRupee className="size-4 text-[#8B5CF6]" aria-hidden="true" />
        <h3 className={fashionDnaCardTitleClass}>Budget Profile</h3>
      </div>

      <div className="space-y-4 md:space-y-6">
        <div>
          <p className="text-xl font-bold text-dashboard-foreground md:text-2xl">
            {budgetRangeLabel || 'Building profile'}
          </p>
          <p className="mt-1 text-xs text-dashboard-muted">Preferred range</p>
        </div>

        {budgetType ? (
          <div>
            <p className="text-base font-semibold text-[#FFC107] md:text-lg">{budgetType}</p>
            <p className="mt-1 text-xs text-dashboard-muted">Budget type</p>
          </div>
        ) : null}

        <div>
          <p className="text-xl font-bold text-dashboard-foreground md:text-2xl">{spendLabel}</p>
          <p className="mt-1 text-xs text-dashboard-muted">Average interaction value</p>
        </div>
      </div>

      {averageSpending ? (
        <Progress value={spendProgress || 0} className="mt-auto h-2" />
      ) : null}
    </section>
  );
}
