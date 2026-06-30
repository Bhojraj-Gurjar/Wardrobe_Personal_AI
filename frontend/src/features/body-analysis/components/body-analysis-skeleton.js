import { Skeleton } from '@/components/ui/skeleton';

export function BodyAnalysisSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-36 rounded bg-dashboard-surface" />
        <Skeleton className="h-10 w-72 rounded-xl bg-dashboard-surface" />
        <Skeleton className="h-4 w-96 max-w-full rounded bg-dashboard-surface" />
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <Skeleton className="h-[460px] rounded-[24px] bg-dashboard-surface" />
        <Skeleton className="h-[460px] rounded-[24px] bg-dashboard-surface" />
        <Skeleton className="h-[460px] rounded-[24px] bg-dashboard-surface" />
      </div>
      <Skeleton className="h-8 w-56 rounded bg-dashboard-surface" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton
            key={`fit-${index}`}
            className="h-[180px] rounded-[24px] bg-dashboard-surface"
          />
        ))}
      </div>
    </div>
  );
}
