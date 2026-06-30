import { AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';

export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this section. Please try again.',
  onRetry,
  className,
}) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center',
        className,
      )}
      role="alert"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-6" aria-hidden="true" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
