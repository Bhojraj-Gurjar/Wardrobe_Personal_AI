'use client';

import { WelcomeBanner } from '@/features/onboarding/components/welcome-banner';
import { FaceAuthSuccessBanner } from '@/features/face/components/face-auth-success-banner';
import { WelcomeSection } from '@/features/dashboard/components/welcome-section';
import { ActionButtons } from '@/features/dashboard/components/action-buttons';
import { StatsGrid } from '@/features/dashboard/components/stats-grid';
import { TodaysPicks } from '@/features/dashboard/components/todays-picks';
import { FashionDNACard } from '@/features/dashboard/components/fashion-dna-card';
import { DashboardProductFeed } from '@/features/dashboard/components/dashboard-product-feed';
import { useDashboardData } from '@/features/dashboard/hooks';
import { Skeleton } from '@/components/ui/skeleton';

function WelcomeSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-32 rounded bg-dashboard-surface" />
      <Skeleton className="h-10 w-64 rounded-xl bg-dashboard-surface" />
    </div>
  );
}

function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-[6.875rem] rounded-xl bg-dashboard-surface md:h-36 md:rounded-2xl"
        />
      ))}
    </div>
  );
}

export function DashboardView() {
  const {
    greeting,
    displayName,
    stats,
    picks,
    picksLoading,
    picksEmpty,
    dna,
    dnaLoading,
    profileLoading,
    isLoading,
  } = useDashboardData();

  return (
    <div className="mx-auto max-w-7xl space-y-4 md:space-y-6">
      <FaceAuthSuccessBanner />
      <WelcomeBanner />

      <div className="flex flex-col gap-3 md:gap-4 lg:flex-row lg:items-start lg:justify-between">
        {profileLoading ? (
          <WelcomeSkeleton />
        ) : (
          <WelcomeSection greeting={greeting} name={displayName} />
        )}
        <ActionButtons className="lg:pt-2" />
      </div>

      {isLoading ? <StatsGridSkeleton /> : <StatsGrid stats={stats} />}

      <div className="grid min-w-0 gap-4 md:gap-6 lg:grid-cols-[1fr_320px]">
        <TodaysPicks
          picks={picks}
          isLoading={picksLoading}
          isEmpty={picksEmpty}
          className="min-w-0"
        />
        <FashionDNACard dna={dna} isLoading={dnaLoading} className="min-w-0" />
      </div>

      <DashboardProductFeed />
    </div>
  );
}
