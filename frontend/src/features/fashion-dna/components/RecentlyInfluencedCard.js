'use client';

import { TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';

export function RecentlyInfluencedCard({ items = [], className }) {
  return (
    <section
      className={cn(
        'rounded-[24px] border border-dashboard-border bg-[#1A2235] p-6',
        className,
      )}
    >
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-[#8B5CF6]/15 text-[#C4B5FD]">
          <TrendingUp className="size-5" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-dashboard-foreground">Recently Influenced By</h3>
          <p className="text-sm text-dashboard-muted">Products shaping your current DNA</p>
        </div>
      </div>

      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3"
            >
              <p className="font-medium text-dashboard-foreground">{item.name}</p>
              <p className="text-xs text-dashboard-muted">
                {[item.brand, item.category].filter(Boolean).join(' · ')}
              </p>
              {item.sources?.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.sources.map((source) => (
                    <span
                      key={source}
                      className="rounded-full bg-[#8B5CF6]/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#C4B5FD]"
                    >
                      {source.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-dashboard-muted">
          View products, wishlist items, and try-ons to populate this feed.
        </p>
      )}
    </section>
  );
}
