import { Suspense } from 'react';
import { ClosetView } from '@/features/personal-closet/components';
import { Skeleton } from '@/components/ui/skeleton';

function ClosetViewFallback() {
  return (
    <div className="space-y-8 px-4 pb-10">
      <Skeleton className="h-40 rounded-[22px] bg-white/5" />
      <Skeleton className="h-20 rounded-[22px] bg-white/5" />
      <Skeleton className="h-48 rounded-[22px] bg-white/5" />
    </div>
  );
}

export const metadata = {
  title: 'Personal Closet',
};

export default function MyClosetPage() {
  return (
    <Suspense fallback={<ClosetViewFallback />}>
      <ClosetView />
    </Suspense>
  );
}
