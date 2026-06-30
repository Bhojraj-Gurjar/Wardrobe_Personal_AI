import { cn } from '@/utils/cn';
import { Skeleton } from '@/components/ui/skeleton';

export function LoadingState({
  title = 'Loading',
  description = 'Please wait while we fetch your data.',
  className,
  rows = 3,
}) {
  return (
    <div
      className={cn(
        'flex w-full flex-col gap-4 rounded-lg border border-border bg-card p-6',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
