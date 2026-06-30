import { Skeleton } from '@/components/ui/skeleton';

export default function OnboardingLoading() {
  return (
    <div
      className="min-h-screen px-4 py-8 sm:px-6"
      style={{ background: 'var(--onboarding-gradient)' }}
    >
      <div className="mx-auto w-full max-w-[900px] space-y-6">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="size-11 rounded-2xl bg-dashboard-surface" />
          <Skeleton className="h-8 w-64 rounded-xl bg-dashboard-surface" />
          <Skeleton className="h-4 w-80 max-w-full rounded-lg bg-dashboard-surface" />
        </div>
        <Skeleton className="h-24 rounded-2xl bg-dashboard-surface" />
        <Skeleton className="h-[480px] rounded-[var(--onboarding-card-radius)] bg-dashboard-surface" />
      </div>
    </div>
  );
}
