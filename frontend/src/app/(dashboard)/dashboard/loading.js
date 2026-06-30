import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Skeleton className="h-24 w-full max-w-lg rounded-2xl bg-dashboard-surface" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32 rounded bg-dashboard-surface" />
          <Skeleton className="h-10 w-64 rounded-xl bg-dashboard-surface" />
        </div>
        <Skeleton className="h-10 w-48 rounded-xl bg-dashboard-surface" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-36 rounded-2xl bg-dashboard-surface"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Skeleton className="h-64 rounded-2xl bg-dashboard-surface" />
        <Skeleton className="h-64 rounded-2xl bg-dashboard-surface" />
      </div>
    </div>
  );
}
