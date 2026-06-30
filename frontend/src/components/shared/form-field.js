import { cn } from '@/utils/cn';
import { Label } from '@/components/ui/label';

export function FormField({
  id,
  label,
  error,
  hint,
  required,
  className,
  children,
}) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className={cn('space-y-2', className)}>
      {label ? (
        <Label htmlFor={id}>
          {label}
          {required ? (
            <span className="ml-1 text-destructive" aria-hidden="true">
              *
            </span>
          ) : null}
        </Label>
      ) : null}
      {children}
      {hint && !error ? (
        <p id={hintId} className="text-xs text-dashboard-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
