'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, Sparkles } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { EmptyState } from '@/components/shared/empty-state';
import { DashboardProductCard } from '@/features/dashboard/components/dashboard-product-card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/utils/cn';

export function TodaysPicks({ picks, isLoading = false, isEmpty = false, className }) {
  const router = useRouter();

  return (
    <section
      className={cn(
        'interactive-card min-w-0 overflow-hidden rounded-xl border border-dashboard-border bg-dashboard-surface p-3 md:rounded-2xl md:p-5',
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2 md:mb-4 md:gap-3">
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
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] touch-pan-x [&::-webkit-scrollbar]:hidden md:gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-[172px] w-[140px] shrink-0 snap-start rounded-xl bg-dashboard-surface-elevated md:h-52 md:w-[160px] md:rounded-2xl"
            />
          ))}
        </div>
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
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] touch-pan-x [&::-webkit-scrollbar]:hidden md:gap-4">
          {picks.map((pick) => (
            <DashboardProductCard
              key={pick.id}
              name={pick.name}
              image={pick.image}
              matchPercent={pick.matchPercent}
              href={pick.href}
              isMock={pick.isMock}
              className="snap-start"
            />
          ))}
        </div>
      )}
    </section>
  );
}
