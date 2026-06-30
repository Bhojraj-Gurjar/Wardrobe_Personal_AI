'use client';

import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/select';
import { formLabelClass } from '@/components/ui/form-control-styles';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

export function OnboardingField({
  id,
  label,
  required,
  error,
  hint,
  className,
  children,
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {label ? (
        <label htmlFor={id} className={formLabelClass}>
          {label}
          {required ? (
            <span className="ml-1 text-destructive" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {hint && !error ? (
        <p className="text-xs text-dashboard-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function OnboardingInput({ className, ...props }) {
  return <Input className={className} {...props} />;
}

export function OnboardingSelect({ className, children, ...props }) {
  return (
    <SelectField className={className} {...props}>
      {children}
    </SelectField>
  );
}

export function OnboardingSubmitButton({
  children,
  isLoading,
  loadingLabel = 'Saving…',
  className,
  disabled,
  ...props
}) {
  return (
    <button
      type="submit"
      disabled={isLoading || disabled}
      className={cn(
        'flex h-12 w-full items-center justify-center gap-2 rounded-xl',
        'bg-primary text-sm font-semibold text-primary-foreground',
        'shadow-[0_4px_20px_rgba(139,92,246,0.25)] transition-all duration-300',
        'hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_6px_24px_rgba(139,92,246,0.35)]',
        'active:scale-[0.98] disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
