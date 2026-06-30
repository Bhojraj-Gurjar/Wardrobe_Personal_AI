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

  return (    <section
      className={cn(
        'interactive-card rounded-2xl border border-dashboard-border bg-dashboard-surface p-5',
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-dashboard-foreground">
            Today&apos;s Picks
          </h3>
          <Badge
            variant="secondary"
            className="border-primary/20 bg-dashboard-accent-soft text-primary"
          >
            <Sparkles className="mr-1 size-3" aria-hidden="true" />
            AI curated
          </Badge>
        </div>
        <Link
          href={ROUTES.AI.RECOMMENDATIONS}
          prefetch
          className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View all
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-1">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-52 min-w-[160px] flex-1 rounded-2xl bg-dashboard-surface-elevated"
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
          className="border-0 bg-transparent p-6"
        />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-1">
          {picks.map((pick) => (
            <DashboardProductCard
              key={pick.id}
              name={pick.name}
              image={pick.image}
              matchPercent={pick.matchPercent}
              href={pick.href}
              isMock={pick.isMock}
            />
          ))}
        </div>
      )}
    </section>
  );
}
