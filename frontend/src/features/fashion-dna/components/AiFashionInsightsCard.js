'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  fashionDnaCardHeaderGapClass,
  fashionDnaCardShell,
  fashionDnaCardTitleClass,
} from '@/features/fashion-dna/utils/fashion-dna-card-styles';

export function AiFashionInsightsCard({ insights = [], className }) {
  const items = (insights || []).filter(Boolean);

  return (
    <section className={fashionDnaCardShell(className)}>
      <div className={cn('flex items-center gap-2', fashionDnaCardHeaderGapClass)}>
        <Sparkles className="size-4 text-[#8B5CF6]" aria-hidden="true" />
        <h3 className={fashionDnaCardTitleClass}>AI Fashion Insights</h3>
      </div>

      {items.length ? (
        <ul className="space-y-2 md:space-y-3">
          {items.map((insight) => (
            <li
              key={insight}
              className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-xs leading-relaxed text-dashboard-foreground md:px-4 md:py-3 md:text-sm"
            >
              {insight}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-dashboard-muted md:text-sm">
          Browse products, save looks, and build your closet to unlock personalized insights.
        </p>
      )}
    </section>
  );
}
