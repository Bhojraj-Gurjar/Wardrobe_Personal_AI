'use client';

import { Search } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  fashionDnaCardHeaderGapClass,
  fashionDnaCardShell,
  fashionDnaCardSubtitleClass,
  fashionDnaCardTitleClass,
} from '@/features/fashion-dna/utils/fashion-dna-card-styles';

export function SearchBehaviourCard({ searchBehaviour = null, className }) {
  const behaviour = searchBehaviour || {};
  const recentQueries = behaviour.recentQueries || [];
  const topSearches = behaviour.topSearches || [];

  return (
    <section className={fashionDnaCardShell(className)}>
      <div className={cn('flex items-center gap-2.5 md:gap-3', fashionDnaCardHeaderGapClass)}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6]/15 text-[#C4B5FD] md:size-10 md:rounded-2xl">
          <Search className="size-4 md:size-5" />
        </div>
        <div>
          <h3 className={fashionDnaCardTitleClass}>Search Behaviour</h3>
          <p className={fashionDnaCardSubtitleClass}>
            {behaviour.totalSearches
              ? `${behaviour.totalSearches} recent style searches`
              : 'Your search patterns will appear here'}
          </p>
        </div>
      </div>

      {recentQueries.length ? (
        <div className="space-y-3 md:space-y-4">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-dashboard-muted md:mb-2 md:text-xs">
              Recent searches
            </p>
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {recentQueries.map((query) => (
                <span
                  key={query}
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-dashboard-foreground md:px-3 md:py-1.5 md:text-xs"
                >
                  {query}
                </span>
              ))}
            </div>
          </div>

          {topSearches.length ? (
            <div className="space-y-1.5 md:space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-dashboard-muted md:text-xs">
                Frequent terms
              </p>
              {topSearches.map((entry) => (
                <div
                  key={entry.query}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] px-3 py-1.5 text-xs md:py-2 md:text-sm"
                >
                  <span className="text-dashboard-foreground">{entry.query}</span>
                  <span className="text-dashboard-muted">{entry.count}×</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-dashboard-muted md:text-sm">
          Search for styles like &quot;oversized hoodie&quot; or &quot;minimal shirt&quot; to refine your DNA.
        </p>
      )}
    </section>
  );
}
