import { Skeleton } from '@/components/ui/skeleton';

export function FaceAnalysisSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28 rounded bg-[#1A2236]" />
        <Skeleton className="h-10 w-64 rounded-xl bg-[#1A2236]" />
        <Skeleton className="h-4 w-96 max-w-full rounded bg-[#1A2236]" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="min-h-[520px] rounded-[24px] bg-[#1A2236]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:col-span-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={`trait-skeleton-${index}`}
              className="min-h-[220px] rounded-[24px] bg-[#1A2236]"
            />
          ))}
        </div>
      </div>

      <Skeleton className="h-48 rounded-[24px] bg-[#1A2236]" />
    </div>
  );
}
