import { cn } from '@/utils/cn';

export function SecondaryButton({
  className,
  children,
  disabled,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex h-14 w-full items-center justify-center rounded-2xl',
        'border border-white/10 bg-transparent text-base font-semibold text-dashboard-foreground',
        'transition-all duration-200 hover:bg-white/5',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
