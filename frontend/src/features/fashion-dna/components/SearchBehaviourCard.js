'use client';

import { Search } from 'lucide-react';
import { cn } from '@/utils/cn';

export function SearchBehaviourCard({ searchBehaviour = null, className }) {
  const behaviour = searchBehaviour || {};
  const recentQueries = behaviour.recentQueries || [];
  const topSearches = behaviour.topSearches || [];

  return (
    <section
      className={cn(
        'rounded-[24px] border border-dashboard-border bg-[#1A2235] p-6',
        className,
      )}
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-[#8B5CF6]/15 text-[#C4B5FD]">
          <Search className="size-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-dashboard-foreground">Search Behaviour</h3>
          <p className="text-sm text-dashboard-muted">
            {behaviour.totalSearches
              ? `${behaviour.totalSearches} recent style searches`
              : 'Your search patterns will appear here'}
          </p>
        </div>
      </div>

      {recentQueries.length ? (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-dashboard-muted">
              Recent searches
            </p>
            <div className="flex flex-wrap gap-2">
              {recentQueries.map((query) => (
                <span
                  key={query}
                  className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-dashboard-foreground"
                >
                  {query}
                </span>
              ))}
            </div>
          </div>

          {topSearches.length ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-dashboard-muted">
                Frequent terms
              </p>
              {topSearches.map((entry) => (
                <div
                  key={entry.query}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] px-3 py-2 text-sm"
                >
                  <span className="text-dashboard-foreground">{entry.query}</span>
                  <span className="text-dashboard-muted">{entry.count}×</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-dashboard-muted">
          Search for styles like &quot;oversized hoodie&quot; or &quot;minimal shirt&quot; to refine your DNA.
        </p>
      )}
    </section>
  );
}
