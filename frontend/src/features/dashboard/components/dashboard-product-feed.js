'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useDashboardProductFeedData } from '@/features/dashboard/hooks/use-dashboard-product-feed-data';
import { useInView } from '@/features/dashboard/hooks/use-in-view';
import {
  DashboardProductFeedSection,
  DASHBOARD_PRODUCT_SECTIONS,
} from '@/features/dashboard/components/dashboard-product-feed-section';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

const INITIAL_SECTION_COUNT = 4;
const SECTIONS_PER_BATCH = 3;

function FeedIntroSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-72 rounded-lg bg-dashboard-surface" />
      <Skeleton className="h-4 w-96 max-w-full rounded-lg bg-dashboard-surface" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-[420px] min-w-[280px] shrink-0 rounded-2xl bg-dashboard-surface"
          />
        ))}
      </div>
    </div>
  );
}

export function DashboardProductFeed() {
  const { ref: feedRef, inView: feedInView } = useInView({ rootMargin: '240px' });
  const { ref: sentinelRef, inView: sentinelInView } = useInView({
    rootMargin: '320px',
    once: false,
  });

  const [visibleSectionCount, setVisibleSectionCount] = useState(INITIAL_SECTION_COUNT);
  const { feedContext, fashionDna, factors, isLoading } = useDashboardProductFeedData({
    enabled: feedInView,
  });

  const loadMoreSections = useCallback(() => {
    setVisibleSectionCount((current) => Math.min(
      DASHBOARD_PRODUCT_SECTIONS.length,
      current + SECTIONS_PER_BATCH,
    ));
  }, []);

  useEffect(() => {
    if (sentinelInView && visibleSectionCount < DASHBOARD_PRODUCT_SECTIONS.length) {
      loadMoreSections();
    }
  }, [loadMoreSections, sentinelInView, visibleSectionCount]);

  const visibleSections = DASHBOARD_PRODUCT_SECTIONS.slice(0, visibleSectionCount);
  const hasMoreSections = visibleSectionCount < DASHBOARD_PRODUCT_SECTIONS.length;

  return (
    <section
      ref={feedRef}
      aria-label="Personalized product collections"
      className="relative mt-10 border-t border-dashboard-border/70 pt-10"
    >
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="size-3.5" aria-hidden="true" />
            AI Shopping Feed
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-dashboard-foreground sm:text-3xl">
            Keep exploring your style
          </h2>
          <p className="max-w-3xl text-sm text-dashboard-muted sm:text-base">
            Personalized collections powered by your Fashion DNA, face and body analysis,
            closet, wishlist, and browsing history.
          </p>
        </div>
      </div>

      <div className="space-y-12">
        {!feedInView ? (
          <FeedIntroSkeleton />
        ) : (
          visibleSections.map((section) => (
            <DashboardProductFeedSection
              key={section.id}
              section={section}
              feedContext={feedContext}
              fashionDna={fashionDna}
              factors={factors}
              isLoading={isLoading}
            />
          ))
        )}
      </div>

      {feedInView && hasMoreSections ? (
        <div
          ref={sentinelRef}
          className={cn(
            'flex items-center justify-center py-10 transition-opacity duration-300',
            isLoading ? 'opacity-100' : 'opacity-80',
          )}
          aria-hidden="true"
        >
          <div className="flex items-center gap-3 text-sm text-dashboard-muted">
            <span className="size-2 animate-pulse rounded-full bg-primary" />
            Loading more collections…
          </div>
        </div>
      ) : null}
    </section>
  );
}
