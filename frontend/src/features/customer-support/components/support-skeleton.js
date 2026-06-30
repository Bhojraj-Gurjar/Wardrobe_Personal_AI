'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function SupportSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 w-full rounded-[28px]" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 w-full rounded-2xl" />
    </div>
  );
}
