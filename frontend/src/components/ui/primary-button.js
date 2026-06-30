import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export function PrimaryButton({
  className,
  children,
  isLoading = false,
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-6',
        'bg-gradient-to-r from-primary to-purple-dark text-sm font-semibold text-primary-foreground',
        'shadow-sm shadow-black/25 transition-all duration-300 ease-out',
        'hover:-translate-y-0.5 hover:brightness-105 hover:shadow-md hover:shadow-primary/15',
        'active:scale-[0.98]',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
