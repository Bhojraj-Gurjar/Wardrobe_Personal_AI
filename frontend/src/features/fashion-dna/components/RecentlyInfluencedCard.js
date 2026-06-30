'use client';

import { TrendingUp } from 'lucide-react';
import { cn } from '@/utils/cn';
import {
  fashionDnaCardHeaderGapClass,
  fashionDnaCardShell,
  fashionDnaCardSubtitleClass,
  fashionDnaCardTitleClass,
} from '@/features/fashion-dna/utils/fashion-dna-card-styles';

export function RecentlyInfluencedCard({ items = [], className }) {
  return (
    <section className={fashionDnaCardShell(className)}>
      <div className={cn('flex items-center gap-2.5 md:gap-3', fashionDnaCardHeaderGapClass)}>
        <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6]/15 text-[#C4B5FD] md:size-10 md:rounded-2xl">
          <TrendingUp className="size-4 md:size-5" />
        </div>
        <div>
          <h3 className={fashionDnaCardTitleClass}>Recently Influenced By</h3>
          <p className={fashionDnaCardSubtitleClass}>Products shaping your current DNA</p>
        </div>
      </div>

      {items.length ? (
        <div className="space-y-2 md:space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 md:rounded-2xl md:px-4 md:py-3"
            >
              <p className="text-xs font-medium text-dashboard-foreground md:text-base">{item.name}</p>
              <p className="text-[11px] text-dashboard-muted md:text-xs">
                {[item.brand, item.category].filter(Boolean).join(' · ')}
              </p>
              {item.sources?.length ? (
                <div className="mt-1.5 flex flex-wrap gap-1 md:mt-2 md:gap-1.5">
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
        <p className="text-xs text-dashboard-muted md:text-sm">
          View products, wishlist items, and try-ons to populate this feed.
        </p>
      )}
    </section>
  );
}
