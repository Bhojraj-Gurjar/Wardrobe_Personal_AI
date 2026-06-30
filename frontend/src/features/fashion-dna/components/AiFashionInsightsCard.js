'use client';

import { Sparkles } from 'lucide-react';
import { cn } from '@/utils/cn';

export function AiFashionInsightsCard({ insights = [], className }) {
  const items = (insights || []).filter(Boolean);

  return (
    <section
      className={cn(
        'rounded-[24px] border border-dashboard-border bg-[#1A2235] p-6 shadow-lg',
        className,
      )}
    >
      <div className="mb-5 flex items-center gap-2">
        <Sparkles className="size-4 text-[#8B5CF6]" aria-hidden="true" />
        <h3 className="text-base font-semibold text-dashboard-foreground">
          AI Fashion Insights
        </h3>
      </div>

      {items.length ? (
        <ul className="space-y-3">
          {items.map((insight) => (
            <li
              key={insight}
              className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm leading-relaxed text-dashboard-foreground"
            >
              {insight}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-dashboard-muted">
          Browse products, save looks, and build your closet to unlock personalized insights.
        </p>
      )}
    </section>
  );
}
