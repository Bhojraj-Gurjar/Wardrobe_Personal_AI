'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Sparkles } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { EmptyState } from '@/components/shared/empty-state';
import { ProductCatalogCard } from '@/features/products/components/product-catalog-card';
import {
  getTodaysPicksRowStyle,
  TODAYS_PICKS_CARD_SLOT_CLASS,
  TODAYS_PICKS_ROW_CLASS,
  TODAYS_PICKS_SKELETON_COUNT,
} from '@/features/dashboard/constants/todays-picks-layout';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

function TodaysPicksRow({ count, children, className }) {
  return (
    <div
      className={cn(TODAYS_PICKS_ROW_CLASS, className)}
      style={getTodaysPicksRowStyle(count)}
    >
      {children}
    </div>
  );
}

function TodaysPicksCardSlot({ children }) {
  return <div className={TODAYS_PICKS_CARD_SLOT_CLASS}>{children}</div>;
}

function TodaysPicksSkeletonCard() {
  return (
    <article className="overflow-hidden rounded-xl border border-dashboard-border bg-dashboard-surface md:rounded-2xl">
      <Skeleton className="aspect-[3/4] w-full rounded-none bg-dashboard-surface-elevated" />
      <div className="space-y-2 p-3 md:p-4">
        <Skeleton className="h-3 w-28 rounded bg-dashboard-surface-elevated" />
        <Skeleton className="h-10 w-full rounded bg-dashboard-surface-elevated" />
        <Skeleton className="h-3 w-20 rounded bg-dashboard-surface-elevated" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-16 rounded bg-dashboard-surface-elevated" />
          <Skeleton className="size-9 rounded-full bg-dashboard-surface-elevated md:size-10" />
        </div>
      </div>
    </article>
  );
}

export function TodaysPicks({ picks, isLoading = false, isEmpty = false, className }) {
  const router = useRouter();
  const pickCount = isLoading ? TODAYS_PICKS_SKELETON_COUNT : picks?.length || 0;

  return (
    <section
      className={cn(
        'interactive-card min-w-0 overflow-hidden rounded-xl border border-dashboard-border bg-dashboard-surface p-4 md:rounded-2xl md:p-5',
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-2 md:mb-5 md:gap-3">
        <div className="flex min-w-0 items-center gap-1.5 md:gap-2">
          <h3 className="truncate text-base font-semibold text-dashboard-foreground md:text-lg">
            Today&apos;s Picks
          </h3>
          <Badge
            variant="secondary"
            className="shrink-0 border-primary/20 bg-dashboard-accent-soft px-1.5 py-0 text-[10px] text-primary md:px-2 md:text-xs"
          >
            <Sparkles className="mr-0.5 size-2.5 md:mr-1 md:size-3" aria-hidden="true" />
            AI
          </Badge>
        </div>
        <Link
          href={ROUTES.AI.RECOMMENDATIONS}
          prefetch
          className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary hover:underline md:gap-1 md:text-sm"
        >
          View all
          <ChevronRight className="size-3.5 md:size-4" aria-hidden="true" />
        </Link>
      </div>

      {isLoading ? (
        <TodaysPicksRow count={TODAYS_PICKS_SKELETON_COUNT}>
          {Array.from({ length: TODAYS_PICKS_SKELETON_COUNT }).map((_, index) => (
            <TodaysPicksCardSlot key={index}>
              <TodaysPicksSkeletonCard />
            </TodaysPicksCardSlot>
          ))}
        </TodaysPicksRow>
      ) : isEmpty || !picks?.length ? (
        <EmptyState
          icon={Sparkles}
          title="No recommendations yet"
          description="Complete your profile or browse products to unlock AI picks."
          actionLabel="View recommendations"
          onAction={() => router.push(ROUTES.AI.RECOMMENDATIONS)}
          className="border-0 bg-transparent p-4 md:p-6"
        />
      ) : (
        <TodaysPicksRow count={pickCount}>
          {picks.map((pick) => (
            <TodaysPicksCardSlot key={pick.id}>
              <ProductCatalogCard
                product={pick.product}
                matchScore={pick.score}
                featureBadge={{ label: 'For You', tone: 'purple' }}
                recommendationReason={pick.recommendationReason}
                className="h-full"
              />
            </TodaysPicksCardSlot>
          ))}
        </TodaysPicksRow>
      )}
    </section>
  );
}
