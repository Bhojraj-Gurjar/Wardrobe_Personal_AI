'use client';

import { useMemo } from 'react';
import { RecommendationCarouselSection } from '@/features/ai/components/recommendation-carousel-section';
import { useInView } from '@/features/dashboard/hooks/use-in-view';
import {
  DASHBOARD_PRODUCT_SECTIONS,
  resolveDashboardSectionItems,
} from '@/features/dashboard/utils/dashboard-product-sections.util';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

function SectionSkeleton({ title }) {
  return (
    <section className="space-y-4" aria-busy="true" aria-label={`Loading ${title}`}>
      <div className="space-y-2">
        <Skeleton className="h-7 w-56 rounded-lg bg-dashboard-surface" />
        <Skeleton className="h-4 w-80 max-w-full rounded-lg bg-dashboard-surface" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-[420px] min-w-[280px] shrink-0 rounded-2xl bg-dashboard-surface"
          />
        ))}
      </div>
    </section>
  );
}

export function DashboardProductFeedSection({
  section,
  feedContext,
  fashionDna,
  factors,
  isLoading = false,
  showQuickView = true,
}) {
  const { ref, inView } = useInView({ rootMargin: '160px' });

  const items = useMemo(() => {
    if (!feedContext || !inView) {
      return [];
    }

    return resolveDashboardSectionItems(section.id, feedContext);
  }, [feedContext, inView, section.id]);

  return (
    <div
      ref={ref}
      className={cn(
        'transition-all duration-500 ease-out',
        inView ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
      )}
    >
      {!inView || (isLoading && !items.length) ? (
        <SectionSkeleton title={section.title} />
      ) : (
        <RecommendationCarouselSection
          title={section.title}
          subtitle={section.subtitle}
          featureBadge={section.featureBadge}
          items={items}
          mode={section.mode}
          factors={factors}
          fashionDna={fashionDna}
          showQuickView={showQuickView}
          className="scroll-mt-24"
        />
      )}
    </div>
  );
}

export { DASHBOARD_PRODUCT_SECTIONS };
